import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import { Arret } from './Ligne/Arret'
import { Direction } from './Ligne/Direction'
import { Ligne } from './Ligne/Ligne'
import { Passage } from './Ligne/Passage'

/**
 * Support non officiel de l'API du Service de Transport de l'Agglomération Nancéienne (STAN).
 *
 * Ce module permet de récupérer la liste des lignes et arrêts du réseau ainsi que les prochains passages.
 *
 */
export class Stan {
  protected httpClient: AxiosInstance

  /**
  * @example ```js
  * const { Stan } = require('stan-api')
  *
  * const usager = new Stan()
  * ```
  */
  public constructor () {
    this.httpClient = axios.create({
      baseURL: 'https://www.reseau-stan.com/?type=476',
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
  }

  /**
  * Lister les lignes du réseau de transport
  * @example ```js
  * const { Stan } = require('stan-api')
  *
  * const usager = new Stan()
  * usager.getLignes().then(lignes => console.log(lignes))
  * ```
  * @returns {Promise<Ligne[]>}
  */
  public async getLignes (): Promise<Ligne[]> {
    const rep = (await this.httpClient.get('https://www.reseau-stan.com/')).data
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
   * const usager = new Stan()
   *
   * const ligneT4 = {
   *   id: 2332,
   *   numlignepublic: 'T4',
   *   osmid: 'line:GST:4-97',
   *   libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
   * }
   * usager.getArrets(ligneT4).then(arrets => console.log(arrets))
   * ```
   * @returns {Promise<Arret[]>}
   */
  public async getArrets (ligne: Partial<Ligne> & {id: number, numlignepublic: string}): Promise<Arret[]> {
    const rep = (await this.httpClient.request({
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
   * Lister les prochains passages d'un arrêt avec le temps d'attente estimé
   * @param {Arret} arret Arrêt
   * @example ```js
   * const { Stan } = require('stan-api')
   *
   * const usager = new Stan()
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
   * usager.getProchainsPassages(arret).then(p => {
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
   * @returns {Promise<Passage[]>}
   */
  public async getProchainsPassages (arret: Partial<Arret> & {osmid: string, ligne: Partial<Ligne>}): Promise<Passage[]> {
    const rep = (await this.httpClient.request({
      method: 'POST',
      data: qs.stringify({
        requete: 'tempsreel_submit',
        requete_val: {
          arret: arret.osmid,
          ligne_omsid: arret.ligne.osmid
        }
      })
    })).data.split('<li>').slice(1)
    const passages: Passage[] = []

    for (const directionBloc of rep) {
      const direction = /<span>([^"]+)<\/span><\/span>/g.exec(directionBloc) as RegExpExecArray
      const regexPassagesMin = /class="tpsreel-temps-item large-1 ">(\d+) min/g
      const regexPassagesH = /temps-item-heure">(\d+)h(\d+)</g
      let rawPassage
      while ((rawPassage = regexPassagesMin.exec(directionBloc)) !== null) {
        passages.push({
          arret,
          direction: direction[1],
          temps_min: parseInt(rawPassage[1])
        })
      }
      while ((rawPassage = regexPassagesH.exec(directionBloc)) !== null) {
        passages.push({
          arret,
          direction: direction[1],
          temps_min: parseInt(rawPassage[1]) * 60 + parseInt(rawPassage[2])
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
   * const usager = new Stan()
   * const ligneT4 = {
   *   id: 2332,
   *   numlignepublic: 'T4',
   *   osmid: 'line:GST:4-97',
   *   libelle: 'Tempo 4 - Laxou CLB <> Houdemont Porte Sud'
   * }
   * usager.getDirections(ligneT4).then(directions => console.log(directions))
   * ```
   * @returns {Promise<Direction[]>}
   */
  public async getDirections (ligne: Partial<Ligne> & {id: number, numlignepublic: string}): Promise<Direction[]> {
    const rep = (await this.httpClient.request({
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
   * @returns {Promise<Arret[]>}
   */
  public async getArretsDirection (direction: Direction): Promise<Arret[]> {
    const rep = (await this.httpClient.request({
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
        direction: { ...direction, ligne }
      })
    }
    return arrets
  }
}
