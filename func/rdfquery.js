
//const baseURI ="http://localhost:3030/twingenspeed/sparql?";
const baseURI ="https://caia.herokuapp.com/sparql/TwinGen/query?";

const twingenPrefixes =   "PREFIX asb:<https://w3id.org/asbingowl/core#>\n" +
                          "PREFIX asbkey:<https://w3id.org/asbingowl/keys#>\n" +
                          "PREFIX asbkey13:<https://w3id.org/asbingowl/keys/2013#>\n" +
                          "PREFIX dot:<https://w3id.org/dot#>\n"+
                          "PREFIX aoi:<https://w3id.org/aoi#>\n"+
                          "PREFIX ct:<https://standards.iso.org/iso/21597/-1/ed-1/en/Container#>\n"+
                          "PREFIX ls:<https://standards.iso.org/iso/21597/-1/ed-1/en/Linkset#>\n"+
                          "PREFIX schema:<http://schema.org/>\n"+
                          "PREFIX props:<http://lbd.arch.rwth-aachen.de/props#>\n"+
                          "PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>\n"+
                          //instance prefixes:
                          "PREFIX sib:<http://example.org/sibbw0000000#>\n"


const myHeader = new Headers()
myHeader.append("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InR3aW5nZW5UZXN0aW5nMkB0d2luZ2VuLmRlIiwiVVJJIjoiVHdpbkdlbjJfNWVhY2VlYTEtZTE3Yi00YTliLTk1MmItNzFkMjhiMzZlOTE3IiwibmFtZSI6IlR3aW5HZW4yIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2NjQ0NTk3MzcsImV4cCI6MTY5NjAxNzMzN30.9430Z5mkBxUDzWNmUSWsJrSSVCE60wPavmz3kePdtao")
myHeader.append("Content-Type", "application/x-www-form-urlencoded")



export async function getBauteilOfGuid(guid)  {
  const urlencoded = new URLSearchParams();
  urlencoded.append("query",twingenPrefixes+
      `SELECT ?asbBauteil 
      WHERE {
      ?botEle props:globalIdIfcRoot ?root.
      ?root schema:value ${guid} .
      ?asbBauteil asb:hasModelRepresentation ?botEle.
      ?asbBauteil a ?class.
      FILTER (?class != asb:Bauteil)
      FILTER (?class != asb:ASBING13_BauteilDefinition)
      } `);

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}



export async function getAsbEleInfo(guid)  {
  const urlencoded = new URLSearchParams();

  urlencoded.append("query",twingenPrefixes+
      "SELECT DISTINCT ?BauteilInstanz ?BauteilKlasse ?BauteilartKlasse ?BauteilBezeichnung ?Einbauort \n"+
      "WHERE { \n" +
      "?botEle props:globalIdIfcRoot ?root.\n"+
      "?root schema:value '"  +guid+ "' .\n"+
      "?BauteilInstanz asb:hasModelRepresentation ?botEle." +
      "OPTIONAL {\n" +
      "?BauteilInstanz a ?BauteilKlasse;\n" +
        "asb:associatedWith ?bauteilart.\n" +
        "    ?bauteilart a ?BauteilartKlasse.\n" +
        "    OPTIONAL { \n" +
        "    ?bauteilart asb:FahrzeugRueckhaltesystem_Art/asb:ArtFahrzeugRueckhaltesystem_Systembezeichnung/asb:Systembezeichnung_Bezeichnung | asb:EinfacheBauteilart_Art | asb:Unterbau_Art| asb:Gruendung_Art ?BauteilBezeichnung. \n" +
        "    }\n"+
        "    FILTER (?BauteilartKlasse != asb:Teilbauwerk)\n" +
        "    FILTER (?BauteilartKlasse != asb:Bruecke)\n" +
        "    FILTER (?BauteilartKlasse != asb:Bauteil)\n" +
      "}\n" +
       "  OPTIONAL{\n" +
        " ?BauteilInstanz asb:AbstraktesBauteil_Einbauort ?Einbauort.\n" +
        " }\n" +
      "}");

    const SelectRequestOptions = {
    method: 'POST',
    redirect: 'follow',
    headers: myHeader,
    body: urlencoded
    };

    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}

export async function getAsbEleInfoFromSibEle(sibIns)  {
    const sibInsforQuery = "sib:"+sibIns.split("#")[1]
  const urlencoded = new URLSearchParams();

  urlencoded.append("query",twingenPrefixes+
      `SELECT DISTINCT ?BauteilInstanz ?BauteilKlasse ?BauteilartKlasse ?BauteilBezeichnung ?Einbauort ?Einbauort2
      WHERE { 
      { ${sibInsforQuery} a ?BauteilKlasse;
      asb:ObjektMitID_hatObjektID/asb:ObjektID_ID ?asbid.
      ?BauteilInstanz asb:ObjektMitID_hatObjektID/asb:ObjektID_ID ?asbid.
      OPTIONAL {
      ${sibInsforQuery} asb:associatedWith ?bauteilart.
      ?bauteilart a ?BauteilartKlasse.
      OPTIONAL { 
        ?bauteilart asb:FahrzeugRueckhaltesystem_Art/asb:ArtFahrzeugRueckhaltesystem_Systembezeichnung/asb:Systembezeichnung_Bezeichnung | asb:EinfacheBauteilart_Art | asb:Unterbau_Art| asb:Gruendung_Art ?BauteilBezeichnung.
        }
      FILTER (?BauteilartKlasse != asb:Teilbauwerk)
      FILTER (?BauteilartKlasse != asb:Bruecke)
      FILTER (?BauteilartKlasse != asb:Bauteil)
      }
      OPTIONAL{
      ${sibInsforQuery} asb:AbstraktesBauteil_Einbauort ?Einbauort.
      }
      }
      UNION{
      ${sibInsforQuery} asb:ASBING13_Bauteilgruppe ?BauteilKlasse.
      OPTIONAL{
      ${sibInsforQuery} asb:ASBING13_Konstruktionsteil ?BauteilartKlasse.
      }
      OPTIONAL{
       ${sibInsforQuery} asb:ASBING13_Bauteil ?BauteilBezeichnung.}
      OPTIONAL{
       ${sibInsforQuery} asb:Schaden_Ortsangabe/asb:Ortsangabe_Ortsangabe ?Einbauort.
          OPTIONAL{
           ${sibInsforQuery} asb:Schaden_Ortsangabe/asb:Ortsangabe_GroesseOrtsangabe ?Einbauort2.
          }
        }
      }
      }`);

    const SelectRequestOptions = {
    method: 'POST',
    redirect: 'follow',
    headers: myHeader,
    body: urlencoded
    };

    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}

export async function getSchaden(guid, jahr)  {

    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      "SELECT DISTINCT  ?Schaden ?SchadenVersion \n"+
      "WHERE { \n" +
      "?botEle props:globalIdIfcRoot ?root.\n"+
      "?root schema:value '"  +guid+ "' .\n"+
      "?BauteilInstanz asb:hasModelRepresentation ?botEle;\n" +
      "dot:hasDamage | aoi:hasAreaOfInterest/aoi:locatesDamage ?Schaden. \n" +
        "?Schaden asb:hatPruefDokumentation ?SchadenVersion. \n" +
        "FILTER EXISTS {?SchadenVersion dot:coveredInInspection ?Pruefung. \n" +
        "?Pruefung asb:PruefungUeberwachung_Pruefjahr "+jahr+". } \n" +
       "}");

    const SelectRequestOptions = {
    method: 'POST',
    redirect: 'follow',
    headers: myHeader,
    body: urlencoded
    };

    return await fetch(baseURI, SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}

export async function getSchadenFromSibEle(sibIns, jahr)  {
    const sibInsforQuery =  "sib:" + sibIns.split("#")[1]
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      `SELECT DISTINCT  ?Schaden ?SchadenVersion 
      WHERE {
       { ${sibInsforQuery} dot:hasDamage | aoi:hasAreaOfInterest/aoi:locatesDamage ?Schaden. 
        ?Schaden asb:hatPruefDokumentation ?SchadenVersion. 
        FILTER EXISTS {?SchadenVersion dot:coveredInInspection ?Pruefung. 
        ?Pruefung asb:PruefungUeberwachung_Pruefjahr ${jahr}. }
       }
       UNION
       {?Schaden asb:hatBauteilDefinition ${sibInsforQuery}.
       ?Schaden asb:hatPruefDokumentation ?SchadenVersion. 
        FILTER EXISTS {?SchadenVersion dot:coveredInInspection ?Pruefung. 
        ?Pruefung asb:PruefungUeberwachung_Pruefjahr ${jahr}. }
       }
       }
       `);

    const SelectRequestOptions = {
    method: 'POST',
    redirect: 'follow',
    headers: myHeader,
    body: urlencoded
    };

    return await fetch(baseURI, SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}


export async function damageDetails(SchadenVersion) {
    const SchadenVersionQuery = "sib:" + SchadenVersion.split("#")[1]
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        "SELECT DISTINCT  ?SchadenID ?Jahr ?inPruefung ?Bauteilgruppe ?Bauteil ?Konstruktionsteil ?StatusAktuell ?Schadenart ?Schadensgroesse ?Anmerkung ?SchadensBeispiel ?AuswirkungDauerhaftigkeit" +
        "?AuswirkungStandsicherheit ?AuswirkungVerkehrssicherheit\n" +
        "WHERE { \n" +
        "?SchadenObjekt asb:hatPruefDokumentation " + SchadenVersionQuery + "; \n" +
        "asb:Schaden_Status ?StatusAktuell.\n" +
        "" + SchadenVersionQuery + " dot:coveredInInspection ?inPruefung;\n" +
        "asb:Schaden_ID-Nummer-Schaden ?SchadenID; \n" +
        "asb:ASBING13_Bauteilgruppe ?Bauteilgruppe;\n" +
        "asb:Schaden_Schaden | asb:Schaden_Rissart ?Schadenart; \n" +
        "asb:Schaden_AllgemeineMengenangabe ?Schadensgroesse;\n" +
        "asb:PruefungUeberwachung_Pruefjahr ?Jahr;\n" +
        "asb:Schaden_SchadensbewertungDauerhaftigkeit ?AuswirkungDauerhaftigkeit ;\n" +
        "asb:Schaden_SchadensbewertungStandsicherheit ?AuswirkungStandsicherheit ;\n" +
        "asb:Schaden_SchadensbewertungVerkehrssicherheit ?AuswirkungVerkehrssicherheit.\n" +
        "OPTIONAL {" + SchadenVersionQuery + " asb:ASBObjekt_Textfeld ?Anmerkung. }\n" +
        "OPTIONAL {" + SchadenVersionQuery + " asb:ASBING13_Bauteil ?Bauteil. }\n" +
        "OPTIONAL {" + SchadenVersionQuery + " asb:ASBING13_Konstruktionsteil ?Konstruktionsteil. }\n" +
        "OPTIONAL {" + SchadenVersionQuery + " asb:Schaden_Schadensbeispiel ?SchadensBeispiel. }\n" +
        "} \n" +
        "LIMIT 1");

    const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
    };

    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}

    export async function damageRatings(SchadenVersion) {
    const SchadenVersionQuery = "sib:" + SchadenVersion.split("#")[1]
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      `SELECT ?AuswirkungDauerhaftigkeit ?AuswirkungStandsicherheit ?AuswirkungVerkehrssicherheit
      WHERE {
       ${SchadenVersionQuery} asb:Schaden_SchadensbewertungDauerhaftigkeit ?AuswirkungDauerhaftigkeit ;
       asb:Schaden_SchadensbewertungStandsicherheit ?AuswirkungStandsicherheit ;
       asb:Schaden_SchadensbewertungVerkehrssicherheit ?AuswirkungVerkehrssicherheit.
      }`);

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };


    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })

}

export async function damagePicture(SchadenVersion) {
    const SchadenVersionQuery = "sib:" + SchadenVersion.split("#")[1]
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      "SELECT DISTINCT ?fotofilename  \n"+
      "WHERE { \n" +
        "?ident ls:uri " + SchadenVersionQuery + ".\n" +
        "?LinkEle1 ls:hasIdentifier ?ident.\n" +
        "?Link ls:hasLinkElement ?LinkEle1, ?LinkEle2 .\n" +
        "?LinkEle2 ls:hasDocument ?pic.\n" +
        "?pic ct:filename ?fotofilename.\n" +
        "FILTER (?LinkEle2 != ?LinkEle1) \n" +
      "}");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })

}

export async function damageModelElements(damageObj) {
    const damageobjforQuery = "sib:" + damageObj
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      "SELECT DISTINCT  ?guid \n"+
      "WHERE { \n" +
      ""  +damageobjforQuery+ " asb:hasModelRepresentation ?ModelRep.\n" +
      "?ModelRep props:globalIdIfcRoot ?root.\n"+
      "?root schema:value ?guid.\n"+
      "}");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI , SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })

}

export async function getDamageOfPointGuid(guid, jahr) {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      `SELECT DISTINCT ?damageobj ?SchadenID
      WHERE { 
      ?damageobj asb:hasModelRepresentation ?ModelRep. 
      ?ModelRep props:globalIdIfcRoot ?root.
      ?root schema:value '${guid}'.
      ?damageobj asb:Schaden_ID-Nummer-Schaden ?SchadenID; 
      asb:hatPruefDokumentation ?SchadenVersion. 
      ?SchadenVersion dot:coveredInInspection ?Pruefung. 
      ?Pruefung asb:PruefungUeberwachung_Pruefjahr ?jahr. 
      FILTER (?jahr <= ${jahr})
      }`);

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })

}


export async function modeldamageAreas(damageObj) {
    const damageobjforQuery = "sib:" + damageObj
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      "SELECT DISTINCT  ?guid \n"+
      "WHERE { \n" +
      "?aoi aoi:locatesDamage "  +damageobjforQuery+ ". \n" +
       "?aoi asb:hasModelRepresentation ?ModelRep.\n" +
      "?ModelRep props:globalIdIfcRoot ?root.\n"+
      "?root schema:value ?guid.\n"+
      "}");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}

export async function modeldamageTextAreas(damageObj) {
    const damageobjforQuery = "sib:" + damageObj
    const urlencoded = new URLSearchParams();
    urlencoded.append("query",twingenPrefixes+
      "SELECT DISTINCT  ?Ortsangabe \n"+
      "WHERE { \n" +
      "?aoi aoi:locatesDamage "  +damageobjforQuery+ ". \n" +
       "?aoi a ?Ortsangabe \n" +
      "FILTER (?Ortsangabe != aoi:AreaOfInterest) \n"+
      "}");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
    .then((response) => response.json())
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}

export async function describeElement(uri)  {
  const urisplit = uri.split("#")
  let prefix
  if (urisplit[0] === "https://w3id.org/asbingowl/core"){
      prefix = "asb:"
  }
  else if(urisplit[0] === "https://w3id.org/asbingowl/keys" ){
      prefix = "asbkey:"
  }
  else if (urisplit[0] ==="https://w3id.org/asbingowl/keys/2013"){
      prefix = "asbkey13:"
  }
  else if (urisplit[0] === "http://example.org/sibbw0000000"){
      prefix = "sib:"
  }
  const uriforQuery = prefix + urisplit[1]
  const urlencoded = new URLSearchParams();
  urlencoded.append("query",twingenPrefixes+
      `SELECT * 
      WHERE {
      ${uriforQuery} ?Eigenschaft ?Wert.
      FILTER (!isBlank(?Wert))
      }
      `);

      const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
    .then((response) => response.json() )
    .then((result) =>{
        return result
    })
    .catch(error => {
        console.warn(error)
        return {}
    })
}


export async function damageVersions(SchadenVersion) {
    const SchadenVersionQuery = "sib:" + SchadenVersion.split("#")[1]
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        "SELECT DISTINCT  ?vorherigeVersion ?naechsteVersion \n" +
        "WHERE { \n" +
        "OPTIONAL {" + SchadenVersionQuery + " asb:hasPriorState ?vorherigeVersion.}\n" +
        "OPTIONAL {" + SchadenVersionQuery + " asb:hasLaterState ?naechsteVersion.}\n" +
        "} \n");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI , SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getAllInspections() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        `SELECT DISTINCT  ?Pruefung ?Jahr ?PruefartLit ?Pruefart 
        WHERE {
        ?Pruefung a asb:PruefungMitZustandsnote ; 
        asb:PruefungUeberwachung_Pruefjahr ?Jahr ; 
        asb:PruefungUeberwachung_ErlaeuterungPruefart ?PruefartLit.
        OPTIONAL { ?Pruefung asb:PruefungUeberwachung_Pruefart ?Pruefart.} 
        } 
        ORDER BY (?Jahr)`);

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getAllDamagesOfYear(jahr) {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
     "SELECT DISTINCT  ?Schaden ?SchadenVersion ?SchadenID \n"+
      "WHERE { \n" +
      "?Schaden a asb:SchadenObjekt. \n" +
      "?Schaden asb:Schaden_ID-Nummer-Schaden ?SchadenID. \n" +
      "?Schaden asb:hatPruefDokumentation ?SchadenVersion. \n" +
      "FILTER EXISTS {?SchadenVersion dot:coveredInInspection ?Pruefung. \n" +
      "?Pruefung asb:PruefungUeberwachung_Pruefjahr "+ jahr +". } \n" +
       "} \n" +
       "ORDER BY (?SchadenID)");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI , SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getSibTreeElementsSuperstructure() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
   "SELECT DISTINCT ?bauwerk ?teilbauwerk ?bauteil ?bauteilklasse ?bauteilartklasse ?spezBez ?ort ?guid\n" +
        "WHERE \n" +
        "  {\n" +
        "  ?bauteil a ?bauteilklasse.\n" +
        "  ?bauteilklasse rdfs:subClassOf* asb:AbstraktesBauteil.\n" +
        "  ?bauteil asb:hasModelRepresentation ?modelRep.\n" +
        "  ?modelRep props:globalIdIfcRoot ?root.\n" +
        "  ?root schema:value ?guid. \n" +
        "  OPTIONAL{\n" +
        "    ?bauteil asb:associatedWith ?bauteilart.\n" +
        "    ?bauteilart a ?bauteilartklasse.\n" +
        "    OPTIONAL { \n" +
        "    ?bauteilart asb:FahrzeugRueckhaltesystem_Art/asb:ArtFahrzeugRueckhaltesystem_Systembezeichnung/asb:Systembezeichnung_Bezeichnung | asb:EinfacheBauteilart_Art ?spezBez\n" +
        "    }\n"+
        "    FILTER (?bauteilartklasse != asb:Teilbauwerk)\n" +
        "    FILTER (?bauteilartklasse != asb:Bruecke)\n" +
        "    FILTER (?bauteilartklasse != asb:Bauteil)\n" +
        "  }\n" +
        "  OPTIONAL{\n" +
        "  \t?bauteil asb:AbstraktesBauteil_Einbauort ?ort.\n" +
        "  }\n" +
        "  FILTER (?bauteilklasse != asb:Unterbau)\n" +
        "  FILTER (?bauteilklasse != asb:Gruendung)\n" +
        "  FILTER (?bauteilklasse != asb:OberBauteil)\n" +
        "  FILTER (?bauteilklasse != asb:Bauteilergaenzung)\n" +
        "} \n" +
        "ORDER BY ?bauteilartklasse \n"
    );

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getSibTreeElementsOthers() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        "SELECT DISTINCT ?bauteil ?bauteilklasse ?bauteilartklasse ?guid \n"+
        "WHERE { \n"+
        "    ?bauteil a asb:ASBING13_BauteilDefinition.\n" +
        "    ?bauteil  asb:hasModelRepresentation ?modelRep.\n" +
        "    ?modelRep props:globalIdIfcRoot ?root.\n" +
        "    ?root schema:value ?guid. \n" +
        "    ?bauteil asb:ASBING13_Bauteilgruppe ?bauteilklasse.\n" +
        "    ?bauteil asb:ASBING13_Konstruktionsteil ?bauteilartklasse.\n" +
        "}\n" +
        "ORDER BY ?bauteilartklasse"
         );

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getSibTreeElementsSubstructure() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        "SELECT DISTINCT ?bauteil ?bauteilklasse ?bauteilartklasse ?guid\n" +
        "WHERE \n" +
        "  {\n" +
        "  ?bauteil a ?bauteilklasse.\n" +
        "  ?bauteilklasse rdfs:subClassOf* asb:AbstraktesBauteil.\n" +
        "  ?bauteil asb:hasModelRepresentation ?modelRep.\n" +
        "  ?modelRep props:globalIdIfcRoot ?root.\n" +
        "  ?root schema:value ?guid. \n" +
        "  ?bauteil asb:Unterbau_Art| asb:Gruendung_Art ?bauteilartklasse.\n" +
        "  FILTER (?bauteilklasse != asb:Bauteil)\n" +
        "  FILTER (?bauteilklasse != asb:Ueberbau)\n" +
        "  FILTER (?bauteilklasse != asb:OberBauteil)\n" +
        "  FILTER (?bauteilklasse != asb:Bauteilergaenzung)\n" +
        "}\n" +
        "ORDER BY ?bauteilartklasse"
        );

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getBauwerk() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        "SELECT ?bauwerk \n" +
        "WHERE {\n" +
        "?bauwerk a asb:Bauwerk.\n" +
        "}");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI , SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

export async function getTeilbauwerk() {
    const urlencoded = new URLSearchParams();
    urlencoded.append("query", twingenPrefixes +
        "SELECT ?teilbauwerk \n" +
        "WHERE {\n" +
        "?teilbauwerk a asb:Teilbauwerk.\n" +
        "}");

        const SelectRequestOptions = {
        method: 'POST',
        redirect: 'follow',
        headers: myHeader,
        body: urlencoded
        };

    return await fetch(baseURI, SelectRequestOptions)
        .then((response) => response.json())
        .then((result) => {
            return result
        })
        .catch(error => {
            console.warn(error)
            return {}
        })
}

