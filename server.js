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

// Configuration du stockage des images en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Charger les produits depuis le fichier JSON
const loadProducts = () => {
    try {
        const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
        return products.map(product => {
            if (product.image) {
                product.image = `data:image/png;base64,${product.image}`;
            }
            return product;
        });
    } catch (error) {
        console.error("Erreur lors du chargement des produits :", error);
        return [];
    }
};

// Enregistrer les produits dans le fichier JSON
const saveProducts = (products) => {
    try {
        const productsToSave = products.map(product => {
            if (product.image && product.image.startsWith("data:image/png;base64,")) {
                product.image = product.image.split(",")[1];
            }
            return product;
        });
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(productsToSave, null, 2));
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
        image: req.file ? req.file.buffer.toString("base64") : null,
        categorie: req.body.categorie,
        prix: req.body.prix
    };
    console.log('New product added:', newProduct);
    products.push(newProduct);
    saveProducts(products);
    res.status(201).json(newProduct);
});

// Modifier un produit
app.put("/products/:id", upload.single("image"), (req, res) => {
    let products = loadProducts();
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    if (productIndex !== -1) {
        const updatedProduct = {
            ...products[productIndex],
            nom: req.body.nom,
            description: req.body.description,
            image: req.file ? req.file.buffer.toString("base64") : products[productIndex].image,
            categorie: req.body.categorie,
            prix: req.body.prix
        };
        console.log('Product updated:', updatedProduct);
        products[productIndex] = updatedProduct;
        saveProducts(products);
        res.json(updatedProduct);
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
