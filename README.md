<a name="Stan"></a>

## Stan
Support non officiel de l'API du Service de Transport de l'Agglomération Nancéienne (STAN).

**Kind**: global class  

* [Stan](#Stan)
    * [.getLignes()](#Stan+getLignes) ⇒ <code>Promise.&lt;Array.&lt;Ligne&gt;&gt;</code>
    * [.getArrets(ligne)](#Stan+getArrets) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>
    * [.getProchainsPassages(arret)](#Stan+getProchainsPassages) ⇒ <code>Promise.&lt;Array.&lt;Passage&gt;&gt;</code>
    * [.getDirections(ligne)](#Stan+getDirections) ⇒ <code>Promise.&lt;Array.&lt;Direction&gt;&gt;</code>
    * [.getArretsDirection(direction)](#Stan+getArretsDirection) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>

<a name="Stan+getLignes"></a>

### stan.getLignes() ⇒ <code>Promise.&lt;Array.&lt;Ligne&gt;&gt;</code>
Lister les lignes du réseau de transport

**Kind**: instance method of [<code>Stan</code>](#Stan)  
**Example**  
```js
<a name="Stan+getArrets"></a>

### stan.getArrets(ligne) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>
Liste des arrêts d'une ligne

**Kind**: instance method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| ligne | <code>Ligne</code> | Ligne |

**Example**  
```js
<a name="Stan+getProchainsPassages"></a>

### stan.getProchainsPassages(arret) ⇒ <code>Promise.&lt;Array.&lt;Passage&gt;&gt;</code>
Lister les prochains passages d'un arrêt avec le temps d'arrivé estimé

**Kind**: instance method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| arret | <code>Arret</code> | Arrêt |

**Example**  
```js
<a name="Stan+getDirections"></a>

### stan.getDirections(ligne) ⇒ <code>Promise.&lt;Array.&lt;Direction&gt;&gt;</code>
Lister les directions d'une ligne

**Kind**: instance method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| ligne | <code>Ligne</code> | Ligne |

**Example**  
```js
<a name="Stan+getArretsDirection"></a>

### stan.getArretsDirection(direction) ⇒ <code>Promise.&lt;Array.&lt;Arret&gt;&gt;</code>
Lister les arrêts sur le chemin d'une direction d'une ligne

**Kind**: instance method of [<code>Stan</code>](#Stan)  

| Param | Type | Description |
| --- | --- | --- |
| direction | <code>Direction</code> | Direction d'une ligne |
