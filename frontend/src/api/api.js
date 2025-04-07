// src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://chees-script.onrender.com/api",
  // Antigua URL en local baseURL: "http://localhost:8000",
  withCredentials: true, 
});

export default API;
