const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Configurer le stockage des images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Charger les produits depuis products.json
const loadProducts = () => {
    try {
        return JSON.parse(fs.readFileSync('products.json', 'utf8'));
    } catch (error) {
        return [];
    }
};

// Lister tous les produits
app.get('/products', (req, res) => {
    res.json(loadProducts());
});

// Ajouter un produit avec une image
app.post('/products', upload.single('image'), (req, res) => {
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
    fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
    res.json(newProduct);
});

// Modifier un produit
app.put('/products/:id', (req, res) => {
    let products = loadProducts();
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    if (productIndex !== -1) {
        products[productIndex] = { ...products[productIndex], ...req.body };
        fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
        res.json(products[productIndex]);
    } else {
        res.status(404).json({ message: 'Produit non trouvé' });
    }
});

// Supprimer un produit
app.delete('/products/:id', (req, res) => {
    let products = loadProducts();
    const newProducts = products.filter(p => p.id !== parseInt(req.params.id));
    fs.writeFileSync('products.json', JSON.stringify(newProducts, null, 2));
    res.json({ message: 'Produit supprimé' });
});

// Servir les images statiques
app.use('/uploads', express.static('uploads'));

// Lancer le serveur
app.listen(PORT, () => console.log(`✅ Serveur en ligne sur http://localhost:${PORT}`));
