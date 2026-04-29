import axios from 'axios';

const BASE_URL = 'https://us-central1-yau-app.cloudfunctions.net/apis';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  primarySport: string;
  secondarySports?: string[];
  experience?: string;
  hourlyRate?: number;
  status: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
  assignedTeams?: any[];
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export const coachService = {
  getCoaches: async (): Promise<Coach[]> => {
    const response = await api.get('/coaches');
    return response.data.data;
  },

  getCoachById: async (id: string): Promise<Coach> => {
    const response = await api.get(`/coaches/${id}`);
    return response.data.data;
  },

  createCoach: async (coachData: Partial<Coach>) => {
    const response = await api.post('/coaches', coachData);
    return response.data;
  },

  updateCoach: async (id: string, coachData: Partial<Coach>) => {
    const response = await api.put(`/coaches/${id}`, coachData);
    return response.data;
  },

  deleteCoach: async (id: string) => {
    const response = await api.delete(`/coaches/${id}`);
    return response.data;
  },
};

export interface UniformOrder {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  team: string;
  ageGroup: string;
  uniformTop: string;
  uniformBottom: string;
  paymentStatus: string;
  received: boolean;
  orderDate: string;
  notes?: string;
}

export const uniformService = {
  getOrders: async (filters: any = {}): Promise<UniformOrder[]> => {
    const response = await api.get('/uniforms', { params: filters });
    return response.data.uniforms || [];
  },

  updateStatus: async (orderId: string, received: boolean) => {
    const response = await api.put(`/uniforms/${orderId}/received`, { received });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/uniforms/summary');
    return response.data;
  }
};

export default api;