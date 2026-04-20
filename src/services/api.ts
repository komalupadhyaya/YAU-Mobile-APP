const API_BASE_URL = "https://yau-app.onrender.com";

export interface RegistrationData {
  parentFirstName: string;
  parentLastName: string;
  email: string;
  phone: string;
  location: string;
  sport: string;
  membershipType: 'paid' | 'free';
  students: {
    firstName: string;
    lastName: string;
    grade: string;
    schoolName: string;
    dob: string;
    ageGroup?: string;
    sport: string;
  }[];
  fcmToken?: string;
}

export interface Member {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  sport: string;
  membershipType: "paid" | "free";
  registrationSource: "mobile";
  createdAt: any;
  students: any[];
  fcmToken?: string;
}

export interface AdminPost {
  id: string;
  title: string;
  body: string;
  timestamp: any;
  sport?: string;
  location?: string;
  ageGroup?: string;
}

export interface Schedule {
  id: string;
  date: string;
  time: string;
  location: string;
  school: string;
  sport: string;
  gradeBand: string;
  timestamp?: any;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API Error: ${response.status}`);
  }
  return response.json();
}

export async function registerMember(data: RegistrationData): Promise<{ success: boolean; error?: string; memberId?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/members/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await handleResponse(response);
    return { success: true, memberId: result.memberId };
  } catch (error) {
    console.error('Registration API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    };
  }
}

export async function getMessages(sport?: string, location?: string, ageGroup?: string): Promise<AdminPost[]> {
  try {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (location) params.append('location', location);
    if (ageGroup) params.append('ageGroup', ageGroup);

    const response = await fetch(`${API_BASE_URL}/api/messages?${params.toString()}`);
    const result = await handleResponse(response);
    return result.messages || [];
  } catch (error) {
    console.error('Messages API error:', error);
    return [];
  }
}

export async function getSchedules(sport?: string, location?: string): Promise<Schedule[]> {
  try {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (location) params.append('location', location);

    const response = await fetch(`${API_BASE_URL}/api/schedules?${params.toString()}`);
    const result = await handleResponse(response);
    return result.schedules || [];
  } catch (error) {
    console.error('Schedules API error:', error);
    return [];
  }
}
