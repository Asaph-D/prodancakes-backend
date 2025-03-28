const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(express.json());

// Configuration Cloudinary
cloudinary.config({
    cloud_name: 'drq1q1lq0',
    api_key: '883915988383819',
    api_secret: '22C8UzIULz1i6Jg9wxS2rmgPTT8'
});

// Configuration Multer avec Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'products', // Nom du dossier dans Cloudinary
        format: async (req, file) => 'png',
        public_id: (req, file) => Date.now() + '-' + file.originalname
    }
});

const upload = multer({ storage });

// Assurer que le fichier products.json existe
const PRODUCTS_FILE = "products.json";
if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, "[]");
}

// Charger les produits depuis le fichier JSON
const loadProducts = () => {
    try {
        return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
    } catch (error) {
        console.error("Erreur lors du chargement des produits :", error);
        return [];
    }
};

// Enregistrer les produits dans le fichier JSON
const saveProducts = (products) => {
    try {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
    } catch (error) {
        console.error("Erreur lors de l'enregistrement des produits :", error);
    }
};

// Lister tous les produits
app.get("/products", (req, res) => {
    res.json(loadProducts());
});

// Ajouter un produit avec une image (Stockage sur Cloudinary)
app.post("/products", upload.single("image"), (req, res) => {
    let products = loadProducts();
    const newProduct = {
        id: products.length + 1,
        nom: req.body.nom,
        description: req.body.description,
        image: req.file ? req.file.path : null, // Utilisation de l'URL Cloudinary
        categorie: req.body.categorie,
        prix: req.body.prix
    };
    products.push(newProduct);
    saveProducts(products);
    res.status(201).json(newProduct);
});

// Modifier un produit
app.put("/products/:id", (req, res) => {
    let products = loadProducts();
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    if (productIndex !== -1) {
        products[productIndex] = { ...products[productIndex], ...req.body };
        saveProducts(products);
        res.json(products[productIndex]);
    } else {
        res.status(404).json({ message: "Produit non trouvé" });
    }
});

// Supprimer un produit
app.delete("/products/:id", (req, res) => {
    let products = loadProducts();
    const newProducts = products.filter(p => p.id !== parseInt(req.params.id));
    saveProducts(newProducts);
    res.json({ message: "Produit supprimé" });
});

// Lancer le serveur
app.listen(PORT, () => console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`));
