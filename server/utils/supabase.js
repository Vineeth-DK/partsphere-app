const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uploadToSupabase = async (file) => {
    // 1. Validate Keys First
    const hasKeys = process.env.SUPABASE_URL && process.env.SUPABASE_KEY;
    // Basic check to ensure key isn't just an empty string or placeholder
    const isValidKey = process.env.SUPABASE_KEY && process.env.SUPABASE_KEY.length > 20; 

    if (!hasKeys || !isValidKey) {
        console.log("⚠️ Using Local Storage (Supabase Keys missing or invalid)");
        return saveLocally(file);
    }

    try {
        // 2. Cloud Upload Attempt
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
        // Sanitize filename
        const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        
        const { error } = await supabase.storage
            .from('partsphere-assets')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) throw error;

        const { data } = supabase.storage
            .from('partsphere-assets')
            .getPublicUrl(fileName);
            
        return data.publicUrl;

    } catch (err) {
        console.error("⚠️ Cloud Upload Failed:", err.message);
        console.log("🔄 Falling back to Local Storage...");
        return saveLocally(file);
    }
};

// Helper for Local Save
const saveLocally = (file) => {
    const fileName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const uploadDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    fs.writeFileSync(path.join(uploadDir, fileName), file.buffer);
    return `/uploads/${fileName}`;
};

module.exports = { uploadToSupabase };