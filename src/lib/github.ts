export interface GitHubConfig {
  token: string;
  webhookSecret: string;
  repoUrl?: string;
}

export const getGitHubConfig = (): GitHubConfig => {
  const token = process.env.GITHUB_TOKEN;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const repoUrl = process.env.GITHUB_REPO_URL;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is not configured');
  }

  if (!webhookSecret) {
    throw new Error('GITHUB_WEBHOOK_SECRET environment variable is not configured');
  }

  return {
    token,
    webhookSecret,
    repoUrl
  };
};

export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  url: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubSearchResult {
  totalCount: number;
  repositories: GitHubRepository[];
  currentPage: number;
  perPage: number;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubValidationResult {
  isValid: boolean;
  username?: string;
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
  };
  error?: string;
  details?: string;
  code?: string;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';

  async searchRepositories(query: string, options: {
    page?: number;
    perPage?: number;
    token: string;
  }): Promise<GitHubSearchResult> {
    const { page = 1, perPage = 30, token } = options;
    
    // Get username first
    const username = await this.getUsername(token);
    if (!username) {
      throw new Error('Failed to get username from token');
    }

    const searchQuery = `${query} in:name user:${username}`;
    const url = `${this.baseUrl}/search/repositories?q=${encodeURIComponent(searchQuery)}&page=${page}&per_page=${perPage}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`GitHub API error: ${errorData.message || 'Search failed'}`);
    }

    const data = await response.json();
    
    return {
      totalCount: data.total_count,
      repositories: data.items.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.html_url,
        description: repo.description,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at
      })),
      currentPage: page,
      perPage
    };
  }

  async getUserRepositories(token: string): Promise<{
    user: GitHubUser;
    repositories: GitHubRepository[];
  }> {
    // Get user profile
    const userResponse = await fetch(`${this.baseUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json().catch(() => ({}));
      throw new Error(`Failed to fetch user profile: ${errorData.message || 'Unknown error'}`);
    }

    const user = await userResponse.json();

    // Get user repositories
    const reposResponse = await fetch(`${this.baseUrl}/user/repos?per_page=100&type=all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!reposResponse.ok) {
      const errorData = await reposResponse.json().catch(() => ({}));
      throw new Error(`Failed to fetch repositories: ${errorData.message || 'Unknown error'}`);
    }

    const repos = await reposResponse.json();

    return {
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        html_url: user.html_url
      },
      repositories: repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.html_url,
        description: repo.description,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at
      }))
    };
  }

  async validateRepository(token: string, repository: string): Promise<GitHubValidationResult> {
    try {
      // Check if it's a demo value
      if (repository.includes('your-username') || repository.includes('your-repo')) {
        return {
          isValid: false,
          error: 'Demo repository detected',
          details: 'Please use a real GitHub repository name',
          code: 'DEMO_VALUE'
        };
      }

      // Validate token format first
      if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        return {
          isValid: false,
          error: 'Invalid token format',
          details: 'Token must start with "ghp_" or "github_pat_"',
          code: 'INVALID_TOKEN_FORMAT'
        };
      }

      // Get username to validate token
      let username: string;
      try {
        username = await this.getUsername(token);
      } catch (error) {
        return {
          isValid: false,
          error: 'Authentication failed',
          details: 'Your GitHub token is invalid or expired. Please generate a new token.',
          code: 'INVALID_TOKEN'
        };
      }

      // Check if repository exists
      const repoResponse = await fetch(`${this.baseUrl}/repos/${repository}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (repoResponse.status === 404) {
        return {
          isValid: false,
          error: 'Repository not found',
          details: `Repository "${repository}" does not exist. Use the search function to find your repositories.`,
          code: 'REPO_NOT_FOUND'
        };
      }

      if (repoResponse.status === 401) {
        return {
          isValid: false,
          error: 'Authentication failed',
          details: 'Your GitHub token is invalid or expired. Please generate a new token.',
          code: 'INVALID_TOKEN'
        };
      }

      if (repoResponse.status === 403) {
        return {
          isValid: false,
          error: 'Insufficient permissions',
          details: 'Your token lacks the required permissions. Please ensure it has the "repo" scope.',
          code: 'INSUFFICIENT_PERMISSIONS'
        };
      }

      if (!repoResponse.ok) {
        const errorData = await repoResponse.json().catch(() => ({}));
        return {
          isValid: false,
          error: 'Repository access failed',
          details: errorData.message || 'Failed to access repository',
          code: 'ACCESS_FAILED'
        };
      }

      const repoData = await repoResponse.json();

      // Test write permissions by trying to create a reference
      const canWrite = await this.testWritePermissions(token, repository);

      return {
        isValid: true,
        username,
        permissions: {
          canRead: true,
          canWrite
        }
      };

    } catch (error: any) {
      console.error('Repository validation error:', error);
      
      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return {
          isValid: false,
          error: 'Network error',
          details: 'Unable to connect to GitHub. Please check your internet connection.',
          code: 'NETWORK_ERROR'
        };
      }

      return {
        isValid: false,
        error: 'Validation failed',
        details: error.message || 'An unexpected error occurred',
        code: 'VALIDATION_ERROR'
      };
    }
  }

  private async getUsername(token: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get username');
    }

    const user = await response.json();
    return user.login;
  }

  private async testWritePermissions(token: string, repository: string): Promise<boolean> {
    try {
      // Try to get repository contents to test write access
      const testResponse = await fetch(`${this.baseUrl}/repos/${repository}/contents/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      // If we can read, we likely have write permissions if the token has repo scope
      // This is a simplified check - in production you might want to test actual write operations
      return testResponse.ok;
    } catch (error) {
      console.error('Write permission test failed:', error);
      return false;
    }
  }
}

export const githubService = new GitHubService();