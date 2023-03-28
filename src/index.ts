import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import { Arret } from './Ligne/Arret'
import { Direction } from './Ligne/Direction'
import { Ligne } from './Ligne/Ligne'
import { Passage } from './Ligne/Passage'
import { Place } from './Ligne/Place'

/**
 * Support non officiel de l'API du Service de Transport de l'Agglomération Nancéienne (STAN).
 *
 * Ce module permet de récupérer:
 * - les prochains passages
 * - les lignes
 * - les directions
 * - les arrêts
 *
 */
export class Stan {
  /**
  * Lister les lignes du réseau de transport
  * @example ```js
  * const { Stan } = require('stan-api')
  *
  * Stan.getLignes().then(lignes => console.log(lignes))
  * ```
  * @returns {Promise<Ligne[]>} Une liste contenant les lignes du réseau
  */
  public static async getLignes (): Promise<Ligne[]> {
    const rep = (await Stan.getClient().get('https://www.reseau-stan.com/')).data
    const regex = /data-ligne="(\d+)" data-numlignepublic="([^"]+)" data-osmid="(line[^"+]+)" data-libelle="([^"]+)" value="[^"]+">/g
    const lignes: Ligne[] = []
    let rawLigne
    while ((rawLigne = regex.exec(rep)) !== null) {
      lignes.push({
        id: parseInt(rawLigne[1]),
        numlignepublic: rawLigne[2],
        osmid: rawLigne[3],
        libelle: rawLigne[4].replace('&lt;', '<').replace('&gt;', '>').replace(/&#039;/g, "'")
      })
    }
    return lignes
  }

  /**
   * Liste des arrêts d'une ligne
   *
   * NB: Un arret peut être commun à plusieurs lignes.
   * @param {Ligne} ligne Ligne
   * @example ```js
   * const { Stan } = require('stan-api')
   *
   * const ligneT4 = {
   *   id: 2332,
   *   numlignepublic: 'T4',
   *   osmid: 'line:GST:4-97',
   *   libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
   * }
   * Stan.getArrets(ligneT4).then(arrets => console.log(arrets))
   * ```
   * @returns {Promise<Arret[]>} Une liste contenant les arrêts de la ligne
   */
  public static async getArrets (ligne: Partial<Ligne> & {id: number, numlignepublic: string}): Promise<Arret[]> {
    const rep = (await Stan.getClient().request({
      method: 'POST',
      data: qs.stringify({
        requete: 'tempsreel_arrets',
        requete_val: {
          ligne: ligne.id,
          numlignepublic: ligne.numlignepublic
        }
      })
    })).data
    const regex = /data-libelle="([^"]+)" data-ligne="(\d+)" data-numlignepublic="(\w+)" value="([^"]+)">([^"]+)<\/option>/g
    const arrets: Arret[] = []
    let rawArret
    while ((rawArret = regex.exec(rep)) !== null) {
      arrets.push({
        ligne,
        libelle: rawArret[1],
        osmid: rawArret[4]
      })
    }
    return arrets
  }

  /**
   * Lister les prochains passages d'un arrêt avec le temps d'attente estimé.
   * Il n'est pas nécessaire de préciser une ligne, on récupère alors tous les passages des lignes desservants l'arrêt
   * @param {Arret} arret Arrêt
   * @example ```js
   * const { Stan } = require('stan-api')
   *
   * const arret = {
   *   ligne: {
   *     id: 2332,
   *     numlignepublic: 'T4',
   *     osmid: 'line:GST:4-97',
   *     libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
   *   },
   *   libelle: 'Place Stanislas - Dom Calmet',
   *   osmid: 'stop_point:GST:SP:NYPCL1'
   * }
   * Stan.getProchainsPassages(arret).then(p => {
   *   console.log(`Liste des prochains passages de l'arrêt "${arret.libelle}" de la ligne ${arret.ligne.numlignepublic}:
   * ${p.map(passage => `${passage.direction} - Temps d'attente: ${Math.trunc(passage.temps_min/60)}H${passage.temps_min%60}min`).join('\n')}`)
   * })
   * ```
   * ```
   * Exemple sortie:
   * Liste des prochains passages de l'arrêt "Place Stanislas - Dom Calmet" de la ligne T4:
   * Direction Houdemont Porte Sud - Temps d'attente: 0H1min
   * Direction Houdemont Porte Sud - Temps d'attente: 0H8min
   * Direction Laxou Champ-le-Boeuf - Temps d'attente: 0H1min
   * Direction Laxou Champ-le-Boeuf - Temps d'attente: 0H8min
   * ```
   * @returns {Promise<Passage[]>} Les prochains passages d'un arrêt
   */
  public static async getProchainsPassages (arret: Partial<Arret> & {osmid: string, ligne?: Partial<Ligne>}): Promise<Passage[]> {
    const rep = (await Stan.getClient().request({
      method: 'POST',
      data: qs.stringify({
        requete: 'tempsreel_submit',
        requete_val: {
          arret: arret.osmid,
          ligne_omsid: arret.ligne?.osmid
        }
      })
    })).data.split('<li>').slice(1)
    const passages: Passage[] = []

    for (const rawPassageLi of rep) {
      const direction = /<span>([^"]+)<\/span><\/span>/g.exec(rawPassageLi) as RegExpExecArray
      const ligne = /<span id="ui-ligne-(\d+)".*\/pictolignes\/([^"]+).png'/g.exec(rawPassageLi) as RegExpExecArray
      const regexPassagesNow = /class="tpsreel-temps-item large-1 "><i class="icon-car1"><\/i><i title="Temps Réel" class="icon-wifi2"><\/i>/g
      const regexPassagesMin = /class="tpsreel-temps-item large-1 ">(\d+) min/g
      const regexPassagesH = /temps-item-heure">(\d+)h(\d+)(.*)<\/a>/g
      let rawPassage
      while ((rawPassage = regexPassagesMin.exec(rawPassageLi)) !== null) {
        passages.push({
          arret: { ligne: { ...arret.ligne, id: parseInt(ligne[1], 10), numlignepublic: ligne[2] }, ...arret },
          direction: direction[1],
          temps_min: parseInt(rawPassage[1]),
          temps_theorique: false
        })
      }
      while ((rawPassage = regexPassagesH.exec(rawPassageLi)) !== null) {
        passages.push({
          arret: { ligne: { ...arret.ligne, id: parseInt(ligne[1], 10), numlignepublic: ligne[2] }, ...arret },
          direction: direction[1],
          temps_min: parseInt(rawPassage[1]) * 60 + parseInt(rawPassage[2]),
          temps_theorique: rawPassage[0].includes('tpsreel-temps-item-tpstheorique')
        })
      }
      while ((rawPassage = regexPassagesNow.exec(rawPassageLi)) !== null) {
        passages.push({
          arret: { ligne: { ...arret.ligne, id: parseInt(ligne[1], 10), numlignepublic: ligne[2] }, ...arret },
          direction: direction[1],
          temps_min: 0,
          temps_theorique: false
        })
      }
    }
    return passages
  }

  /**
   * Lister les directions d'une ligne
   * @param {Ligne} ligne Ligne
   * @example ```js
   * const { Stan } = require('stan-api')
   *
   * const ligneT4 = {
   *   id: 2332,
   *   numlignepublic: 'T4',
   *   osmid: 'line:GST:4-97',
   *   libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
   * }
   * Stan.getDirections(ligneT4).then(directions => console.log(directions))
   * ```
   * @returns {Promise<Direction[]>} Une liste contenant les directions d'une ligne
   */
  public static async getDirections (ligne: Partial<Ligne> & {id: number, numlignepublic: string}): Promise<Direction[]> {
    const rep = (await Stan.getClient().request({
      method: 'POST',
      data: qs.stringify({
        requete: 'horaires_directions',
        requete_val: {
          ligne: ligne.id,
          numlignepublic: ligne.numlignepublic
        }
      })
    })).data
    const regex = /data-direction="([^"]+)" data-libelle="([^"]+)" value="(\d+)">([^"]+)<\/option>/g
    const directions: Direction[] = []
    let rawDirection
    while ((rawDirection = regex.exec(rep)) !== null) {
      directions.push({
        ligne,
        direction: rawDirection[1],
        libelle: rawDirection[2],
        id: parseInt(rawDirection[3])
      })
    }
    return directions
  }

  /**
   * Lister les arrêts sur le chemin d'une direction d'une ligne
   * @param {Direction} direction Direction d'une ligne
   * @returns {Promise<Arret[]>} Les arrêts de la direction
   */
  public static async getArretsDirection (direction: Direction): Promise<Arret[]> {
    const rep = (await Stan.getClient().request({
      method: 'POST',
      data: qs.stringify({
        requete: 'horaires_arrets',
        with_last_item: false,
        requete_val: {
          ligne: direction.ligne.id,
          id_direction: direction.id,
          direction: direction.direction,
          numlignepublic: direction.ligne.numlignepublic
        }
      })
    })).data
    const regex = /data-libelle="([^"+]+)" data-ligne="(\d+)" data-numlignepublic="([^"]+)" data-direction="([^"]+)" value="(\d+)">[^"]+<\/option>/g
    const arrets: Arret[] = []
    let rawArret
    while ((rawArret = regex.exec(rep)) !== null) {
      const ligne = { ...direction.ligne, id: parseInt(rawArret[2]), numlignepublic: rawArret[3] }
      arrets.push({
        ligne,
        libelle: rawArret[1],
        id: parseInt(rawArret[5]),
        direction: { ...direction, ligne },
        osmid: ''
      })
    }
    return arrets
  }

  /**
   * Rechercher un arrêt et obtenir l'identifiant associé (OSMID) nécessaire pour obtenir les prochains passages
   * @param {string} request Le nom d'un arrêt à chercher
   * @returns Une liste contenant les arrêts et les identifiants associés
   */
  public static async getArretOsmid(request: string): Promise<{osmid: string, libelle: string}[]> {
    return (await Stan.getClient().request<Place[]>({
      method: 'POST',
      data: qs.stringify({
        requete: 'autocomplete_places',
        requete_val: {
          request
        }
      })
    })).data.filter((place: Place) => place.value.startsWith('stop_area:')).map(place => ({osmid: place.value, libelle: place.label}))
  }

  private static getClient (): AxiosInstance {
    return axios.create({
      baseURL: 'https://www.reseau-stan.com/?type=476',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
  }
}
