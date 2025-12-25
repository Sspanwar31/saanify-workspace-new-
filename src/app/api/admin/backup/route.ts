import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Helper function to fetch GitHub settings
async function getGitHubSettings() {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('system_settings')
    .select('github_repo, github_username, github_token, github_branch')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching GitHub settings:', error);
    return null;
  }

  return data;
}

// Helper function to create GitHub backup
async function createGitHubBackup(githubSettings: any, backupData: any) {
  const { github_repo, github_username, github_token, github_branch } = githubSettings;
  
  if (!github_repo || !github_username || !github_token) {
    throw new Error('GitHub settings not configured');
  }

  // Create backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.json`;
  const path = `backups/${filename}`;

  // Prepare content
  const content = JSON.stringify(backupData, null, 2);
  const contentBase64 = Buffer.from(content).toString('base64');

  // GitHub API URL
  const apiUrl = `https://api.github.com/repos/${github_username}/${github_repo}/contents/${path}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${github_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Automated backup - ${new Date().toISOString()}`,
        content: contentBase64,
        branch: github_branch || 'main'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API Error: ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      filename,
      url: result.content?.html_url,
      sha: result.content?.sha
    };

  } catch (error) {
    console.error('GitHub backup error:', error);
    throw error;
  }
}

// POST: Create and push backup to GitHub
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get GitHub settings
    const githubSettings = await getGitHubSettings();
    
    if (!githubSettings) {
      return NextResponse.json(
        { error: 'GitHub settings not configured. Please configure GitHub settings first.' },
        { status: 400 }
      );
    }

    // Fetch all data from tables
    const [clientsResult, invoicesResult] = await Promise.all([
      supabase.from('clients').select('*'),
      supabase.from('invoices').select('*')
    ]);

    if (clientsResult.error) {
      console.error('Error fetching clients:', clientsResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch clients data' },
        { status: 500 }
      );
    }

    if (invoicesResult.error) {
      console.error('Error fetching invoices:', invoicesResult.error);
      return NextResponse.json(
        { error: 'Failed to fetch invoices data' },
        { status: 500 }
      );
    }

    // Create backup object
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      metadata: {
        total_clients: clientsResult.data?.length || 0,
        total_invoices: invoicesResult.data?.length || 0,
        backup_type: 'automated'
      },
      data: {
        clients: clientsResult.data || [],
        invoices: invoicesResult.data || []
      }
    };

    // Create backup on GitHub
    const backupResult = await createGitHubBackup(githubSettings, backupData);

    // Update last backup timestamp in system_settings
    await supabase
      .from('system_settings')
      .update({ last_backup: new Date().toISOString() })
      .eq('id', 1);

    return NextResponse.json({
      success: true,
      message: 'Backup created and pushed to GitHub successfully',
      backup: {
        filename: backupResult.filename,
        url: backupResult.url,
        timestamp: backupData.timestamp,
        size: JSON.stringify(backupData).length
      }
    });

  } catch (error: any) {
    console.error('Backup API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create backup',
        details: error.stack 
      },
      { status: 500 }
    );
  }
}

// GET: Get backup status and recent backups
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Get GitHub settings
    const githubSettings = await getGitHubSettings();
    
    if (!githubSettings) {
      return NextResponse.json({
        configured: false,
        message: 'GitHub settings not configured',
        lastBackup: null
      });
    }

    // Get last backup timestamp
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('last_backup')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      configured: true,
      github_repo: githubSettings.github_repo,
      github_username: githubSettings.github_username,
      lastBackup: settingsData?.last_backup,
      message: 'Backup is configured and ready'
    });

  } catch (error: any) {
    console.error('Backup GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get backup status' },
      { status: 500 }
    );
  }
}