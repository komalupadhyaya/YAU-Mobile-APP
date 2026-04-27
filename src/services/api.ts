import { Member } from '../types';

const API_BASE_URL = 'https://us-central1-yau-app.cloudfunctions.net/apis';

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Request failed: ${response.status}`);
  }

  return response.json();
};

export const apiService = {
  // Member Registration
  registerMember: async (memberData: any) => {
    try {
      console.log('🚀 Sending Member Data to /members:', JSON.stringify(memberData, null, 2));
      return await apiRequest('/members', {
        method: 'POST',
        body: JSON.stringify(memberData),
      });
    } catch (error) {
      console.error('API registerMember error:', error);
      throw error;
    }
  },

  // Update Member
  updateMember: async (id: string, updates: Partial<Member>) => {
    try {
      return await apiRequest(`/members/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('API updateMember error:', error);
      throw error;
    }
  },

  // Get Member by Email
  getMemberByEmail: async (email: string) => {
    try {
      const response = await apiRequest(`/members/email/${email}`);
      
      // FALLBACK LOGIC: 
      // If the backend hasn't been updated, it might return { success: true, email: '...' }
      // without the full profile data (like firstName, students, etc.)
      const isPartialData = response.success && response.email && !response.data && !response.students;
      
      if (isPartialData) {
        console.warn('[API] Received partial data from /members/email, falling back to /members list...');
        const allMembersResponse = await apiRequest('/members');
        const membersList = allMembersResponse.data || [];
        const member = membersList.find((m: any) => m.email?.toLowerCase() === email.toLowerCase());
        
        if (member) {
          return { success: true, data: member };
        }
      }
      
      return response;
    } catch (error) {
      console.error('API getMemberByEmail error:', error);
      throw error;
    }
  },
};

export default apiService;
