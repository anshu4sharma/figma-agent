import { MISTRAL_API_KEY, FIGMA_API_KEY } from "./env";
import { Mistral } from "@mistralai/mistralai";
import axios from "axios";

const client = new Mistral({ apiKey: MISTRAL_API_KEY });

const FIGMA_API_BASE = "https://api.figma.com/v1";

// Extract fileKey and nodeId from Figma URL
function extractFigmaDetails(url: string): { fileKey: string; nodeId?: string } | null {
  const match = url.match(/design\/([^\/?]+).*?node-id=([\d-]+)/);
  if (match) return { fileKey: match[1], nodeId: match[2] };
  
  const fileMatch = url.match(/design\/([^\/?]+)/);
  return fileMatch ? { fileKey: fileMatch[1] } : null;
}

// Fetch specific node from Figma file
async function getFigmaNode(fileKey: string, nodeId: string) {
  try {
    const response = await axios.get(`${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeId}`, {
      headers: { "X-Figma-Token": FIGMA_API_KEY },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching Figma node:", error);
  }
}

// Extract only usable components from Figma response
function extractUsableComponents(figmaData: any) {
  const nodes = figmaData?.nodes || {};
  const extractedComponents: any[] = [];

  for (const nodeId in nodes) {
    const node = nodes[nodeId]?.document;
    if (node && node.type === "FRAME") {
      extractedComponents.push({
        id: node.id,
        name: node.name,
        type: node.type,
        children: node.children?.map((child: any) => ({
          id: child.id,
          name: child.name,
          type: child.type,
          styles: child.styles,
        })),
      });
    }
  }

  return extractedComponents;
}

// Generate React + Tailwind Code from Figma
async function generateCodeFromFigma(figmaUrl: string) {
  const details = extractFigmaDetails(figmaUrl);
  if (!details) return console.error("Invalid Figma URL format.");

  const { fileKey, nodeId } = details;
  console.log(`Extracted File Key: ${fileKey}, Node ID: ${nodeId || "None"}`);

  let figmaData;
  try {
    figmaData = nodeId ? await getFigmaNode(fileKey, nodeId) : null;
  } catch (error) {
    return console.error("Failed to fetch Figma data.");
  }

  if (!figmaData) return console.error("No Figma data received.");

  const usableComponents = extractUsableComponents(figmaData);

  try {
    const response = await client.chat.complete({
      model: "mistral-small",
      messages: [
        { role: "system", content: "You are an expert frontend developer. Convert the following Figma component data into a React + Tailwind CSS component." },
        { role: "user", content: JSON.stringify(usableComponents, null, 2) },
      ],
    });
    console.log("Generated React Code:\n", response?.choices![0]?.message?.content || "");
  } catch (error) {
    console.error("Error generating code:", error);
  }
}

// Call function
generateCodeFromFigma("https://www.figma.com/design/yOGdkEZy28ujmsIdIVxfUc/MJC-MLM-(Copy)?node-id=2-196");