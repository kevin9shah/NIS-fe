import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 600000, // 10 minutes (for heavy ML operations)
    headers: { 'Content-Type': 'application/json' },
});

export const uploadDataset = (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const loadDirectory = (data: { directory_path: string; sample_frac: number }) => {
    return api.post('/load_directory', data);
};

export const trainModel = (data: {
    session_id: string;
    algorithm: string;
    test_size: number;
    hyperparams?: Record<string, number>;
}) => api.post('/train', data);

export const runPrediction = (data: {
    session_id: string;
    model_id: string;
    qtta_params?: { base_threshold: number; alpha: number; d: number };
}) => api.post('/predict', data);

export const getExplanation = (data: {
    session_id: string;
    model_id: string;
}) => api.post('/explain', data);

export const runSimulation = (data: {
    session_id: string;
    model_id: string;
    vary_packet_count: number[];
    vary_mean_packet_size: number[];
    qtta_params?: { base_threshold: number; alpha: number; d: number };
}) => api.post('/simulate', data);

export const healthCheck = () => api.get('/health');

export default api;
