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
      return await apiRequest(`/members/email/${email}`);
    } catch (error) {
      console.error('API getMemberByEmail error:', error);
      throw error;
    }
  },
};

export default apiService;
