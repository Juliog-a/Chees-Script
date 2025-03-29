// src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://chees-script.onrender.com/api",
  withCredentials: true, 
});

export default API;
