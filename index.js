const express = require("express");
const multer = require("multer");

const Tesseract = require("tesseract.js");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

//file uploads
const upload = multer({
  dest: "uploads/", 
});

//sending receipt to OCR and returning
app.post("/upload", upload.single("receipt"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });

  }

    try {
        const result = await Tesseract.recognize(file.path, "eng");
        const text = result.data.text;
        
        const lines = text.split("\n");
        const storeName = lines[0];
        const location = lines[1]; 
        const address = lines[2]; 
        const lineItems = [];
        let totalAmount = 0;

        //parsing data
        lines.forEach((line) => {
        const itemMatch = line.match(/^(.+?)\s+([\d.]+)$/); 
        if (itemMatch) {
            lineItems.push({ name: itemMatch[1], value: parseFloat(itemMatch[2]) });
        }
        

        const totalMatch = line.match(/total[:\s]+([\d.]+)/i);
        if (totalMatch) {
            totalAmount = parseFloat(totalMatch[1]);
        }
    });

    //return json format
    res.json({
        storeName: storeName || "Unknown Store", 
        address: address|| "Uknown",
        location: location||"Unknown",
        lineItems: lineItems.length > 0 ? lineItems : [{ name: "No items found", value: 0 }],
        totalAmount: totalAmount || 0,

    });
  
  } catch (error) {
    res.status(500).json({ error: "Failed to process receipt" });
  }
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);


  
});
