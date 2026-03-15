const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. Check for Supabase Cloud Credentials
let supabase;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    console.log("☁️ Supabase credentials found! Connecting to cloud storage...");
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
} else {
    console.log("📁 No Supabase credentials found. Images will be saved locally.");
}

const uploadToSupabase = async (file) => {
    // Sanitize the file name to remove weird spaces
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    // 2. THE LOCAL FALLBACK
    if (!supabase) {
        // Ensure the uploads folder exists
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        // Save the raw buffer data from Multer directly to the hard drive
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, file.buffer);
        
        // Return the relative local path
        return `/uploads/${fileName}`; 
    }

    // 3. THE CLOUD UPLOAD (If Supabase is configured)
    const { data, error } = await supabase.storage
        .from('partsphere') // Make sure you have a bucket named 'partsphere' in Supabase!
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });

    if (error) {
        console.error("Supabase Error:", error);
        throw new Error("Supabase Upload Failed: " + error.message);
    }
    
    // Get the public URL to send back to the database
    const { data: publicUrlData } = supabase.storage
        .from('partsphere')
        .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
};

module.exports = { uploadToSupabase };