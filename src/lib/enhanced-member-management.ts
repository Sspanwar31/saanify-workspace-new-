'use client'

// Enhanced member management functions with comprehensive error handling and logging
import { makeApiCall } from '@/lib/enhanced-api-interceptor'
import { toast } from 'sonner'

export interface MemberData {
  id?: string
  name: string
  phone?: string
  email?: string
  address?: string
  joinDate?: string
  status?: string
}

export interface MemberResponse {
  success: boolean
  member?: MemberData
  error?: string
  details?: string
}

export interface MemberListResponse {
  success: boolean
  members?: MemberData[]
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
  error?: string
}

// Enhanced member update function
export const handleUpdateMember = async (memberId: string, updateData: Partial<MemberData>): Promise<MemberResponse> => {
  console.log('🔄 [MEMBER] Starting member update', {
    memberId,
    updateData,
    timestamp: new Date().toISOString()
  })

  try {
    // Validate required fields
    if (!memberId) {
      const error = 'Member ID is required for update'
      console.error('❌ [MEMBER] Validation failed', { error, memberId })
      toast.error('Validation failed: Member ID is required')
      return { success: false, error }
    }

    if (!updateData.name) {
      const error = 'Member name is required'
      console.error('❌ [MEMBER] Validation failed', { error, updateData })
      toast.error('Validation failed: Member name is required')
      return { success: false, error }
    }

    // Sanitize update data
    const sanitizedData = {
      name: updateData.name?.trim(),
      phone: updateData.phone?.trim() || undefined,
      email: updateData.email?.trim() || undefined,
      address: updateData.address?.trim() || undefined,
      joinDate: updateData.joinDate || undefined
    }

    console.log('📤 [MEMBER] Sending update request', {
      memberId,
      sanitizedData
    })

    const response = await makeApiCall(`/api/client/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(sanitizedData),
    })

    console.log('✅ [MEMBER] Member updated successfully', {
      memberId,
      response,
    })

    toast.success('Member updated successfully')
    
    return {
      success: true,
      member: response.member || response
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ [MEMBER] Update failed', {
      memberId,
      updateData,
      error: errorMessage,
      stack: errorStack,
    })

    // Show appropriate toast based on error type
    if (errorMessage.includes('409')) {
      toast.error('Update failed: Phone number already exists')
    } else if (errorMessage.includes('404')) {
      toast.error('Update failed: Member not found')
    } else if (errorMessage.includes('400')) {
      toast.error('Update failed: Invalid data provided')
    } else if (errorMessage.includes('500')) {
      toast.error('Update failed: Server error occurred')
    } else {
      toast.error(`Update failed: ${errorMessage}`)
    }

    return {
      success: false,
      error: errorMessage,
      details: errorStack
    }
  }
}

// Enhanced member creation function
export const handleCreateMember = async (memberData: MemberData): Promise<MemberResponse> => {
  console.log('➕ [MEMBER] Starting member creation', {
    memberData,
    timestamp: new Date().toISOString()
  })

  try {
    // Validate required fields
    if (!memberData.name) {
      const error = 'Member name is required'
      console.error('❌ [MEMBER] Validation failed', { error, memberData })
      toast.error('Validation failed: Member name is required')
      return { success: false, error }
    }

    // Sanitize member data
    const sanitizedData = {
      name: memberData.name.trim(),
      phone: memberData.phone?.trim() || undefined,
      email: memberData.email?.trim() || undefined,
      address: memberData.address?.trim() || undefined,
      joinDate: memberData.joinDate || new Date().toISOString().split('T')[0]
    }

    console.log('📤 [MEMBER] Sending creation request', {
      sanitizedData
    })

    const response = await makeApiCall('/api/client/members', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    })

    console.log('✅ [MEMBER] Member created successfully', {
      memberId: response.member?.id || response.id,
      response,
    })

    toast.success('Member created successfully')
    
    return {
      success: true,
      member: response.member || response
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ [MEMBER] Creation failed', {
      memberData,
      error: errorMessage,
      stack: errorStack,
    })

    // Show appropriate toast based on error type
    if (errorMessage.includes('409')) {
      toast.error('Creation failed: Member with this phone number already exists')
    } else if (errorMessage.includes('400')) {
      toast.error('Creation failed: Invalid data provided')
    } else if (errorMessage.includes('500')) {
      toast.error('Creation failed: Server error occurred')
    } else {
      toast.error(`Creation failed: ${errorMessage}`)
    }

    return {
      success: false,
      error: errorMessage,
      details: errorStack
    }
  }
}

// Enhanced member fetch function
export const handleFetchMembers = async (page: number = 1, limit: number = 10, search: string = ''): Promise<MemberListResponse> => {
  console.log('📋 [MEMBER] Starting member fetch', {
    page,
    limit,
    search,
    timestamp: new Date().toISOString()
  })

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    })

    const response = await makeApiCall(`/api/client/members?${queryParams}`)

    console.log('✅ [MEMBER] Members fetched successfully', {
      count: response.members?.length || 0,
      pagination: response.pagination,
    })

    return {
      success: true,
      members: response.members,
      pagination: response.pagination
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ [MEMBER] Fetch failed', {
      page,
      limit,
      search,
      error: errorMessage,
      stack: errorStack,
    })

    toast.error(`Failed to fetch members: ${errorMessage}`)

    return {
      success: false,
      error: errorMessage,
      details: errorStack
    }
  }
}

// Enhanced member deletion function
export const handleDeleteMember = async (memberId: string): Promise<{ success: boolean; error?: string; message?: string }> => {
  console.log('🗑️ [MEMBER] Starting member deletion', {
    memberId,
    timestamp: new Date().toISOString()
  })

  try {
    if (!memberId) {
      const error = 'Member ID is required for deletion'
      console.error('❌ [MEMBER] Validation failed', { error, memberId })
      toast.error('Validation failed: Member ID is required')
      return { success: false, error }
    }

    const response = await makeApiCall(`/api/client/members/${memberId}`, {
      method: 'DELETE',
    })

    console.log('✅ [MEMBER] Member deleted successfully', {
      memberId,
      response,
    })

    toast.success('Member deleted successfully')
    
    return {
      success: true,
      message: response.message || 'Member deleted successfully'
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ [MEMBER] Deletion failed', {
      memberId,
      error: errorMessage,
      stack: errorStack,
    })

    // Show appropriate toast based on error type
    if (errorMessage.includes('404')) {
      toast.error('Deletion failed: Member not found')
    } else if (errorMessage.includes('400')) {
      toast.error('Deletion failed: Member has active loans')
    } else if (errorMessage.includes('500')) {
      toast.error('Deletion failed: Server error occurred')
    } else {
      toast.error(`Deletion failed: ${errorMessage}`)
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Enhanced member fetch by ID function
export const handleFetchMemberById = async (memberId: string): Promise<MemberResponse> => {
  console.log('🔍 [MEMBER] Starting member fetch by ID', {
    memberId,
    timestamp: new Date().toISOString()
  })

  try {
    if (!memberId) {
      const error = 'Member ID is required'
      console.error('❌ [MEMBER] Validation failed', { error, memberId })
      toast.error('Validation failed: Member ID is required')
      return { success: false, error }
    }

    const response = await makeApiCall(`/api/client/members/${memberId}`)

    console.log('✅ [MEMBER] Member fetched successfully', {
      memberId,
      response,
    })

    return {
      success: true,
      member: response.member
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('❌ [MEMBER] Fetch by ID failed', {
      memberId,
      error: errorMessage,
      stack: errorStack,
    })

    if (errorMessage.includes('404')) {
      toast.error('Member not found')
    } else {
      toast.error(`Failed to fetch member: ${errorMessage}`)
    }

    return {
      success: false,
      error: errorMessage,
      details: errorStack
    }
  }
}

// Retry mechanism for failed operations
export const retryMemberOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [RETRY] Attempt ${attempt}/${maxRetries}`)
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      
      console.warn(`⚠️ [RETRY] Attempt ${attempt} failed`, {
        error: lastError.message,
        willRetry: attempt < maxRetries
      })

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  console.error(`❌ [RETRY] All ${maxRetries} attempts failed`)
  throw lastError!
}

// Export all functions
export {
  handleUpdateMember as updateMember,
  handleCreateMember as createMember,
  handleFetchMembers as fetchMembers,
  handleDeleteMember as deleteMember,
  handleFetchMemberById as fetchMemberById
}