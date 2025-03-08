import dotenv from "dotenv";

dotenv.config();

const FIGMA_API_KEY = process.env.FIGMA_API_KEY as string;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY as string;


export {FIGMA_API_KEY, MISTRAL_API_KEY}