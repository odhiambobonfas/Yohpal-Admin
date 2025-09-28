import "dotenv/config"; // Load environment variables from .env file
import path from "path";

export default { 
    // Allow frontend domain
    ORIGIN: 'http://127.0.0.1:5000',

    // Allow cookies to be sent
    CREDENTIALS: true
};
