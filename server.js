const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors({ origin: "*" }));
app.use(express.json());

// Assurer que le fichier products.json existe
const PRODUCTS_FILE = "products.json";
if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, "[]");
}

// Assurer que le dossier /uploads/ existe
const UPLOADS_DIR = "uploads";
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Configuration du stockage des images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

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

// Ajouter un produit avec une image
app.post("/products", upload.single("image"), (req, res) => {
    let products = loadProducts();
    const newProduct = {
        id: products.length + 1,
        nom: req.body.nom,
        description: req.body.description,
        image: req.file ? `/uploads/${req.file.filename}` : null,
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

// Servir les images statiques
app.use("/uploads", express.static(path.join(__dirname, UPLOADS_DIR)));

// Lancer le serveur
app.listen(PORT, () => console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`));
