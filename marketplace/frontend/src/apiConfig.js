const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// El '|| http://localhost:8000' actúa como un valor por defecto si 
// REACT_APP_API_URL no estuviera definida por alguna razón durante el desarrollo local.

export default API_BASE_URL;