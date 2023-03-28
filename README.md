<a name="Stan"></a>

## Stan
Support non officiel de l'API du Service de Transport de l'Agglomération Nancéienne (STAN).

Ce module permet de récupérer:
- les prochains passages
- les lignes
- les directions
- les arrêts

**Kind**: global class  

* [Stan](#Stan)
    * [.getLignes()](#Stan.getLignes) ⇒ <code>Promise.&lt;Array.&lt;Ligne&gt;&gt;</code>
    * [.getArrets(ligne)](#Stan.getArrets) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>
    * [.getProchainsPassages(arret)](#Stan.getProchainsPassages) ⇒ <code>Promise.&lt;Array.&lt;Passage&gt;&gt;</code>
    * [.getDirections(ligne)](#Stan.getDirections) ⇒ <code>Promise.&lt;Array.&lt;Direction&gt;&gt;</code>
    * [.getArretsDirection(direction)](#Stan.getArretsDirection) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>

<a name="Stan.getLignes"></a>

### Stan.getLignes() ⇒ <code>Promise.&lt;Array.&lt;Ligne&gt;&gt;</code>
Lister les lignes du réseau de transport

**Kind**: static method of [<code>Stan</code>](#Stan)  
**Example**  
```js
const { Stan } = require('stan-api')

Stan.getLignes().then(lignes => console.log(lignes))
```
<a name="Stan.getArrets"></a>

### Stan.getArrets(ligne) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>
Liste des arrêts d'une ligne

NB: Un arret peut être commun à plusieurs lignes.

**Kind**: static method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| ligne | <code>Ligne</code> | Ligne |

**Example**  
```js
const { Stan } = require('stan-api')

const ligneT4 = {
  id: 2332,
  numlignepublic: 'T4',
  osmid: 'line:GST:4-97',
  libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
}
Stan.getArrets(ligneT4).then(arrets => console.log(arrets))
```
<a name="Stan.getProchainsPassages"></a>

### Stan.getProchainsPassages(arret) ⇒ <code>Promise.&lt;Array.&lt;Passage&gt;&gt;</code>
Lister les prochains passages d'un arrêt avec le temps d'attente estimé.
Il n'est pas nécessaire de préciser une ligne, on récupère alors tous les passages des lignes desservants l'arrêt

**Kind**: static method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| arret | <code>Arret</code> | Arrêt |

**Example**  
```js
const { Stan } = require('stan-api')

const arret = {
  ligne: {
    id: 2332,
    numlignepublic: 'T4',
    osmid: 'line:GST:4-97',
    libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
  },
  libelle: 'Place Stanislas - Dom Calmet',
  osmid: 'stop_point:GST:SP:NYPCL1'
}
Stan.getProchainsPassages(arret).then(p => {
  console.log(`Liste des prochains passages de l'arrêt "${arret.libelle}" de la ligne ${arret.ligne.numlignepublic}:
${p.map(passage => `${passage.direction} - Temps d'attente: ${Math.trunc(passage.temps_min/60)}H${passage.temps_min%60}min`).join('\n')}`)
})
```
```
Exemple sortie:
Liste des prochains passages de l'arrêt "Place Stanislas - Dom Calmet" de la ligne T4:
Direction Houdemont Porte Sud - Temps d'attente: 0H1min
Direction Houdemont Porte Sud - Temps d'attente: 0H8min
Direction Laxou Champ-le-Boeuf - Temps d'attente: 0H1min
Direction Laxou Champ-le-Boeuf - Temps d'attente: 0H8min
```
<a name="Stan.getDirections"></a>

### Stan.getDirections(ligne) ⇒ <code>Promise.&lt;Array.&lt;Direction&gt;&gt;</code>
Lister les directions d'une ligne

**Kind**: static method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| ligne | <code>Ligne</code> | Ligne |

**Example**  
```js
const { Stan } = require('stan-api')

const ligneT4 = {
  id: 2332,
  numlignepublic: 'T4',
  osmid: 'line:GST:4-97',
  libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
}
Stan.getDirections(ligneT4).then(directions => console.log(directions))
```
<a name="Stan.getArretsDirection"></a>

### Stan.getArretsDirection(direction) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>
Lister les arrêts sur le chemin d'une direction d'une ligne

**Kind**: static method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| direction | <code>Direction</code> | Direction d'une ligne |

