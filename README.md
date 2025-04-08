BrowserQuest
============

BrowserQuest is a HTML5/JavaScript multiplayer game experiment.


Documentation
-------------

Documentation is located in client and server directories.


License
-------

Code is licensed under MPL 2.0. Content is licensed under CC-BY-SA 3.0.
See the LICENSE file for details.

# 🚀 Lancer BrowserQuest avec Docker

Voici un guide rapide pour faire tourner le serveur BrowserQuest dans Docker et accéder au client en local.

---

## ⚙️ Étapes complètes

```bash
# 1. Cloner le projet si ce n'est pas déjà fait
git clone https://github.com/ModuloInc/browserGame
cd browserGame

# 2. Construire l'image Docker
docker build -t browserquest .

# 3. Lancer le serveur Node.js dans Docker
docker run -p 8000:8000 browserquest


# 4. Installer un serveur statique local (si ce n'est pas déjà fait)
npm install -g serve

# 5. Aller dans le dossier client
cd client

# 6. Lancer le client sur le port 3001
serve -l 3001 .
```


Credit
-------
Created by [Little Workshop](http://www.littleworkshop.fr):

* Franck Lecollinet - [@whatthefranck](http://twitter.com/whatthefranck)
* Guillaume Lecollinet - [@glecollinet](http://twitter.com/glecollinet)