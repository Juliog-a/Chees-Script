import axios from "axios";

const API = axios.create({
  baseURL: "https://chees-script.onrender.com/api",
});


export default API;