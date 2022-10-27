import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
    damageDetails,
    damagePicture,
    damageVersions, getAllDamagesOfYear,
    getAllInspections,
    getAsbEleInfo, getBauwerk, getTeilbauwerk,
    getSchaden, getSibTreeElementsOthers, getSibTreeElementsSubstructure, getSibTreeElementsSuperstructure,
    modeldamageAreas,
    modeldamageTextAreas, getAsbEleInfoFromSibEle, getSchadenFromSibEle, describeElement, getBauteilOfGuid
} from "./rdfquery.js";
import {createSubsetofDamage, getExpressId} from "./ifcFunc.js";

const rawProperties = await fetch('static/aoiIfcProperties.json');
const aoiproperties = await rawProperties.json();

export function openTab(ele, tabname) {
  // Declare all variables
  let i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].classList.remove("active");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  const current = document.getElementById(tabname);
  current.style.display = "block";
  ele.classList.add("active");
}

export async function createSideTabs () {

//create tabbuttons
    const tabbar = document.querySelector(".tab");

    const tabIfc = document.createElement('button');
    tabIfc.textContent = "IFC";
    tabIfc.classList.add("tablinks");
    tabbar.appendChild(tabIfc);
    tabIfc.addEventListener("click", function () {
        openTab(tabIfc, "ifctree");
    });
    tabIfc.click();

    const tabSib = document.createElement('button');
    tabSib.classList.add("tablinks");
    tabSib.textContent = "SIB-BW";
    tabbar.appendChild(tabSib);
    tabSib.addEventListener("click", function () {
        openTab(tabSib, "sibtree");
    });

    const tabPruf = document.createElement('button');
    tabPruf.classList.add("tablinks");
    tabPruf.textContent = "Prüfungen";
    tabbar.appendChild(tabPruf);
    tabPruf.addEventListener("click", function () {
        openTab(tabPruf, "pruftree");
    });
}

export async function createPrufTree(viewer, aoimodelid){
    const prufTree = document.getElementById("pruftree")
    const allInsp = await getAllInspections()
    for (let res in allInsp["results"]["bindings"]) {
        const jahr = allInsp["results"]["bindings"][res]["Jahr"]["value"]
        const prufdiv = document.createElement("div")
        prufTree.appendChild(prufdiv)
        const prufentry = document.createElement("div")
        prufentry.classList.add("caret-new")
        prufentry.classList.add("pruftree-entry")
        let arttext
        try{
             const art = allInsp["results"]["bindings"][res]["Pruefart"]["value"]
             arttext = art.toString().split("_")[1]
        }
        catch (e) {
            const art = allInsp["results"]["bindings"][res]["PruefartLit"]["value"]
            if (art === "H"){
                arttext = "Hauptpruefung"
            }
            else if (art === "E"){
                arttext = "EinfachePruefung"
            }
            else{
                console.log("not defined")
            }
        }
        prufentry.textContent = jahr.toString() +" "+ arttext
        prufdiv.appendChild(prufentry)

        const damages = await getAllDamagesOfYear(jahr)
        for (let r in damages["results"]["bindings"]){
            const damage = damages["results"]["bindings"][r]["SchadenVersion"]["value"]
            const damageobj = damages["results"]["bindings"][r]["Schaden"]["value"]
            const damageid = damages["results"]["bindings"][r]["SchadenID"]["value"]
            const damagetext = document.createElement("div")
            damagetext.textContent = "ID: "+damageid+ " Version:  "+ damage.toString().split("#")[1]
            damagetext.id = damage
            damagetext.classList.add("nested")
            damagetext.classList.add("pruftree-damageentry")
            prufdiv.appendChild(damagetext)

            damagetext.onclick = async() => {
               await createEleBoxForDamageInfo(damageobj,damage,viewer,aoimodelid)
            }
        }

        prufentry.onclick= () => {
            prufentry.classList.toggle("caret-down")
            const damagetexts = prufentry.parentElement.querySelectorAll(".pruftree-damageentry")
            for (let dam of damagetexts){
                dam.classList.toggle("active")
            }
        }

    }

}

export async function createSIBTree(viewer, aoimodelid, jahr, bridgeproperties) {
    const sibTree = document.getElementById("sibtree")
    const sibdiv = document.createElement("div")
    sibTree.appendChild(sibdiv)

    const bauwerk = document.createElement("div")
    sibdiv.appendChild(bauwerk)
    bauwerk.classList.add("caret-new")
    bauwerk.classList.add("sibtree-title")
    const bauwerkInsRes = await getBauwerk();
    const bauwerkIns =  bauwerkInsRes["results"]["bindings"]["0"]["bauwerk"]["value"]
    bauwerk.textContent = "Bauwerk"
    bauwerk.id = bauwerkIns

    const teilbauwerk = document.createElement("div")
    sibdiv.appendChild(teilbauwerk)
    teilbauwerk.classList.add("caret-new")
    teilbauwerk.classList.add("sibtree-title")
    teilbauwerk.classList.add("nested")
    const teilbauwerkInsRes = await getTeilbauwerk();
    const teilbauwerkIns =  teilbauwerkInsRes["results"]["bindings"]["0"]["teilbauwerk"]["value"]
    teilbauwerk.textContent = "Teilbauwerk"
    teilbauwerk.id = teilbauwerkIns

    bauwerk.onclick = () => {
        bauwerk.classList.toggle("caret-down")
        teilbauwerk.classList.toggle("active")
    }

    bauwerk.ondblclick = () => {
        createInfoBox(bauwerk.id, viewer, aoimodelid, jahr)
    }

    const superzone = document.createElement("div")
    sibdiv.appendChild(superzone)
    superzone.classList.add("caret-new")
    superzone.classList.add("sibtree-titlezone")
    superzone.classList.add("nested")
    superzone.id = "superzone"
    superzone.textContent = "Überbau Zone"


    const superstrEleRes = await getSibTreeElementsSuperstructure()
     for (let r in superstrEleRes["results"]["bindings"]){
         const superbauteil = document.createElement("div")
         sibdiv.appendChild(superbauteil)
         superbauteil.classList.add("nested")
         superbauteil.classList.add("sibtree-element")
         superbauteil.classList.add("superzone")
        const superbauteilIns = superstrEleRes["results"]["bindings"][r]["bauteil"]["value"]
        const superbauteilGuid = superstrEleRes["results"]["bindings"][r]["guid"]["value"]
        const expressID = getExpressId(superbauteilGuid,bridgeproperties)
        superbauteil.id = superbauteilIns
        let elementName
        const superbauteilCls = superstrEleRes["results"]["bindings"][r]["bauteilklasse"]["value"]
        try {
            const superbauteilart = superstrEleRes["results"]["bindings"][r]["bauteilartklasse"]["value"]
            try{
                const specialName = superstrEleRes["results"]["bindings"][r]["spezBez"]["value"]
                elementName = specialName.split("_", 4)[3]
                if (!elementName){
                    elementName = specialName.split("_")[1]
                    }
            }
            catch (e) {
               elementName = superbauteilart.split("#")[1]
            }
        }
        catch (e) {
            elementName = superbauteilCls.split("#")[1]
        }
        try {
            const superbauteilort = superstrEleRes["results"]["bindings"][r]["ort"]["value"]
            superbauteil.textContent = elementName +" "+"Ort: "+ superbauteilort
        }
        catch (e) {
            superbauteil.textContent = elementName
        }

        superbauteil.onclick = () =>{
             //createInfoBox(superbauteil.id,viewer, aoimodelid, jahr)
             viewer.IFC.selector.pickIfcItemsByID(0, [expressID],true,true)
        }
        superbauteil.onmouseover = () =>{
             viewer.IFC.selector.prepickIfcItemsByID(0,[expressID])
        }
     }

     const subzone = document.createElement("div")
    sibdiv.appendChild(subzone)
    subzone.classList.add("caret-new")
    subzone.classList.add("sibtree-titlezone")
    subzone.classList.add("nested")
    subzone.id = "subzone"
    subzone.textContent = "Unterbau Zone"


    const substrEleRes = await getSibTreeElementsSubstructure ()
    for (let r in substrEleRes["results"]["bindings"]) {
        const subbauteil = document.createElement("div")
        sibdiv.appendChild(subbauteil)
        subbauteil.classList.add("nested")
        subbauteil.classList.add("sibtree-element")
        subbauteil.classList.add("subzone")
        const subbauteilIns = substrEleRes["results"]["bindings"][r]["bauteil"]["value"]
        subbauteil.id = subbauteilIns
        const subbauteilCls = substrEleRes["results"]["bindings"][r]["bauteilklasse"]["value"]
        const subbauteilGuid = substrEleRes["results"]["bindings"][r]["guid"]["value"]
        const expressID = getExpressId(subbauteilGuid,bridgeproperties)
        const subbauteilart = substrEleRes["results"]["bindings"][r]["bauteilartklasse"]["value"]
        subbauteil.textContent = subbauteilCls.split('#')[1] +" "+ subbauteilart.split("#")[1].split("_")[1]

        subbauteil.onclick = () => {
            //createInfoBox(subbauteil.id,viewer, aoimodelid, jahr)
            viewer.IFC.selector.pickIfcItemsByID(0,[expressID],true,true)
        }

        subbauteil.onmouseover = () => {
            viewer.IFC.selector.prepickIfcItemsByID(0,[expressID])
        }
    }
    //infobox in index erstellen damit jahr geupdatet wird

    const sonstiges = document.createElement("div")
    sibdiv.appendChild(sonstiges)
    sonstiges.classList.add("caret-new")
    sonstiges.classList.add("sibtree-titlezone")
    sonstiges.classList.add("nested")
    sonstiges.id = "otherzone"
    sonstiges.textContent = "Sonstiges"


    const otherEleRes = await getSibTreeElementsOthers()
    for (let r in otherEleRes["results"]["bindings"]) {
        const otherbauteil = document.createElement("div")
        sibdiv.appendChild(otherbauteil)
        otherbauteil.classList.add("nested")
        otherbauteil.classList.add("sibtree-element")
        otherbauteil.classList.add("otherzone")
        const otherbauteilIns = otherEleRes["results"]["bindings"][r]["bauteil"]["value"]
        otherbauteil.id = otherbauteilIns
        const otherbauteilCls = otherEleRes["results"]["bindings"][r]["bauteilklasse"]["value"]
        const otherbauteilGuid = otherEleRes["results"]["bindings"][r]["guid"]["value"]
        const otherbauteilart = otherEleRes["results"]["bindings"][r]["bauteilartklasse"]["value"]
        otherbauteil.textContent =otherbauteilart.split("#")[1].split("_")[1]

        otherbauteil.onclick = () => {
            //createInfoBox(otherbauteil.id, viewer, aoimodelid, jahr)
        }
    }

    const zones = sibdiv.querySelectorAll(".sibtree-titlezone")

    teilbauwerk.onclick = () => {
        teilbauwerk.classList.toggle("caret-down")
        for (let child of zones){
            child.classList.toggle("active")
           }
    }

    teilbauwerk.ondblclick = () => {
        createInfoBox(teilbauwerk.id, viewer, aoimodelid, jahr)
    }

    for (let zone of zones){
        zone.onclick = () => {
            zone.classList.toggle("caret-down")
            const children = zone.parentElement.getElementsByClassName(zone.id.toString())
            for (let child of children){
                child.classList.toggle("active")
            }
        }
    }


}


const loadingText = document.getElementById('loadingText');
export function setupProgressNotification(loadingElem,event) {
    loadingElem.appendChild(loadingText)
      const percent = event.loaded / event.total * 100;
      const result = Math.trunc(percent);
      const formatted = result.toString()
      loadingText.innerHTML= `Loading: ${formatted}%`;
}

export function createEleInfoTable (queryRes){
    const resultArray = queryRes["results"]["bindings"];
    const tables = []
    for (let obj in resultArray ) {
        const bauteilTable = document.createElement("table");
        const bauteilHead = document.createElement("thead");
        bauteilTable.appendChild(bauteilHead);
        const col1 = document.createElement("th");
        bauteilHead.appendChild(col1);
        const col2 = document.createElement("th");
        bauteilHead.appendChild(col2);
        const bauteilBody = document.createElement("tbody");
        bauteilTable.appendChild(bauteilBody);

        const objVal = resultArray[obj];
        for (let prop in objVal) {

            const valueArray = objVal[prop];
            const value = valueArray["value"];
            const valuetype = valueArray["type"];

            const row = document.createElement("tr");
            bauteilBody.appendChild(row);
            const rowP = document.createElement("td");
            rowP.classList.add("propRow")
            rowP.textContent = prop;
            row.appendChild(rowP);
            const rowV = document.createElement("td");
            rowV.classList.add("valueRow")
            row.appendChild(rowV);
            if (valuetype === "uri") {
                const textValue = value.split("#")
                if(textValue[0] === "https://w3id.org/asbingowl/keys/2013" && prop !== "SchadensBeispiel"){
                    rowV.textContent = textValue[1].split("_")[1]
                }
                else{
                    rowV.textContent = textValue[1].replace("_", " ")
                }
                if(textValue[0]==="http://www.w3.org/2002/07/owl" || textValue[0]==="http://www.w3.org/2000/01/rdf-schema") {
                    rowV.textContent = textValue[1]
                }
                else{
                    rowV.classList.add("uriValue")
                    rowV.id = value
                    rowV.onclick =async () => {
                        await createDetailedInfoBox(rowV.id)
                    }
                }
            }
            else {
                rowV.textContent = value
            }
        }
        tables.push(bauteilTable)
    }
    return tables
}

export function createEleInfoTableForDescribeQuery (queryRes){
    const resultArray = queryRes["results"]["bindings"];
    const bauteilTable = document.createElement("table");
    const bauteilHead = document.createElement("thead");
    bauteilTable.appendChild(bauteilHead);
    const col1 = document.createElement("th");
    bauteilHead.appendChild(col1);
    const col2 = document.createElement("th");
    bauteilHead.appendChild(col2);
    const bauteilBody = document.createElement("tbody");
    bauteilTable.appendChild(bauteilBody);

    //const tables = []
    for (let obj in resultArray ) {

        const objVal = resultArray[obj];
        const Property = objVal["Eigenschaft"]["value"]
        const Value = objVal["Wert"]["value"]
        const Valuetype = objVal["Wert"]["type"]

        const row = document.createElement("tr");
        bauteilBody.appendChild(row);
        const rowP = document.createElement("td");
        rowP.classList.add("propRow")
        rowP.textContent = Property.split("#")[1].replace("_"," ");
        row.appendChild(rowP);

        const rowV = document.createElement("td");
        rowV.classList.add("valueRow")
        row.appendChild(rowV);
        if (Valuetype === "uri") {
            const textValue = Value.split("#")
            if(textValue[0] === "https://w3id.org/asbingowl/keys/2013" && Property.split("#")[1] !== "SchadensBeispiel"){
                rowV.textContent = textValue[1].split("_")[1]
                console.log(textValue[1], "test split alte schlüssel")
            }
            else{
                rowV.textContent = textValue[1].replace("_", " ")
            }
            if(textValue[0]==="http://www.w3.org/2002/07/owl" || textValue[0]==="http://www.w3.org/2000/01/rdf-schema") {
                rowV.textContent = textValue[1]
            }
            else{
                rowV.classList.add("uriValue")
                rowV.id = Value
                rowV.onclick =async () => {
                    await createDetailedInfoBox(rowV.id)
                }
            }
        }
        else {
            rowV.textContent = Value
        }
    }

    return bauteilTable
}

// Spatial tree menu


// Tree view
const toggler = document.getElementsByClassName("caret");
for (let i = 0; i < toggler.length; i++) {
    toggler[i].onclick = () => {
        toggler[i].parentElement.querySelector(".nested").classList.toggle("active");
        toggler[i].classList.toggle("caret-down");
    }
}


export function createTreeMenu(ifcProject, modelID, viewer, aoimodel, jahr) {
    const root = document.getElementById("tree-root");
    removeAllChildren(root);
    const ifcProjectNode = createNestedChild(root, ifcProject, viewer, aoimodel, jahr);
    ifcProject.children.forEach(child => {
        constructTreeMenuNode(ifcProjectNode, child, modelID, viewer,aoimodel,jahr );
    });
}

function nodeToString(node, nodeName) {
    if(nodeName) {
        return `${node.type}`+`${nodeName}`
    }
    else {
    return `${node.type}`
    }
}

function constructTreeMenuNode(parent, node,modelID,viewer,aoimodel,jahr ) {
    const children = node.children;
    if (children.length === 0) {
        createSimpleChild(parent, node, modelID, viewer,aoimodel, jahr );
        return;
    }
    const nodeElement = createNestedChild(parent, node);
    children.forEach(child => {
        constructTreeMenuNode(nodeElement, child, modelID, viewer,aoimodel, jahr );
    })
}

function createNestedChild(parent, node) {
    const content = nodeToString(node);
    const root = document.createElement('li');
    createTitle(root, content);
    const childrenContainer = document.createElement('ul');
    childrenContainer.classList.add("nested");
    root.appendChild(childrenContainer);
    parent.appendChild(root);
    return childrenContainer;
}

function createTitle(parent, content) {
    const title = document.createElement("span");
    title.classList.add("caret");
    title.onclick = () => {
        title.parentElement.querySelector(".nested").classList.toggle("active");
        title.classList.toggle("caret-down");
    }
    title.textContent = content;
    parent.appendChild(title);
}

async function createSimpleChild(parent, node, modelID, viewer, aoimodel, jahr) {
    const props = await viewer.IFC.getProperties(modelID, node.expressID, true, false);
    const nodeName = props.Name.value
    const globalId = props.GlobalId.value
    const content = nodeToString(node,nodeName);
    const childNode = document.createElement('li');
    childNode.classList.add('leaf-node');
    childNode.id = globalId
    childNode.textContent = content;
    parent.appendChild(childNode);

    childNode.onmouseover = () => {
        viewer.IFC.selector.prepickIfcItemsByID( 0, [node.expressID]);
        childNode.classList.add("highlight");
    }

    childNode.onclick = async () => {
        await viewer.IFC.selector.pickIfcItemsByID(0, [node.expressID],true,true);
        childNode.classList.add("highlight");
        //await createInfoBox(globalId, viewer, aoimodel, jahr)
    }

    childNode.onmouseleave=()=>{
        childNode.classList.remove("highlight");
    }
}

export function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

export function createLabel(model, position) {
    const container = setupDialog(model, position)
    container.classList.add("previewContainer")

    const picture = document.createElement("div")
    picture.classList.add("previewPicture")
    picture.classList.add("damage-dialog")
    container.appendChild(picture)

    const note = document.createElement("div")
    note.classList.add("previewNote")
    note.classList.add("damage-dialog")
    container.appendChild(note)

    const art = document.createElement("div")
    art.classList.add("previewArt")
    art.classList.add("damage-dialog")
    container.appendChild(art)

    const preview = setupPreview(model, position, container);
    return preview
}

export function setupPreview(model, position, container) {
    const htmlPreview = document.createElement( 'div' );
    htmlPreview.className = 'damage-preview';
    htmlPreview.onmouseover = () => {
        container.classList.remove('collapsed');
    }
    htmlPreview.onmouseleave = () => {
        container.classList.add('collapsed');
    }

    const propsPreview = new CSS2DObject( htmlPreview );
    propsPreview.position.copy(position);

    model.add(propsPreview);
    return htmlPreview
}

export function setupDialog(model, position) {
    const htmlDialog = document.createElement( 'div' );
    htmlDialog.className = 'collapsed';
    const propsDialog = new CSS2DObject( htmlDialog );
    propsDialog.position.copy(position);
    model.add(propsDialog);

    return htmlDialog;
}

export async function createInfoBox(guid, viewer, aoimodelid, jahr) {

  const elebox = document.getElementById("element-info");

  removeAllChildren(elebox);

  addCloseButton(elebox)

  const titleifc = document.createElement("h4");
  titleifc.textContent = `IFC Informationen`;
  elebox.appendChild(titleifc);

  const title = document.createElement("h4");
  title.textContent = `SIB-Bauwerke Informationen`;
  elebox.appendChild(title);

  let eleInfoRes
  let SchadenRes
    //let BauteilForPic
  if (guid.length !== 22){
      eleInfoRes = await getAsbEleInfoFromSibEle(guid);
      SchadenRes = await getSchadenFromSibEle(guid, jahr)
     // BauteilForPic = guid
  }
  else{
      eleInfoRes = await getAsbEleInfo(guid);
      SchadenRes = await getSchaden(guid, jahr);
  //    const BauteilForPicRes = await getBauteilOfGuid(guid)
  //    if( BauteilForPicRes["results"]["bindings"].length > 0){
  //       BauteilForPic=BauteilForPicRes["results"]["bindings"]["0"]["asbBauteil"]["value"]
  }

  const propertyCont = document.createElement("div");
  propertyCont.classList.add("table-container");

  const bauteilInfoTables = createEleInfoTable(eleInfoRes);
  for (let table of bauteilInfoTables){
      propertyCont.appendChild(table)
  }

  elebox.appendChild(propertyCont);

  const SchadenProps = SchadenRes["results"]["bindings"]
  if (SchadenProps.length > 0){
   const schadenCont = document.createElement("span");
   schadenCont.textContent= "Schäden"
   schadenCont.classList.add("caret-new")
   propertyCont.appendChild(schadenCont)

   schadenCont.onclick = () => {
       schadenCont.classList.toggle("caret-down")
       const titles = schadenCont.parentElement.querySelectorAll(".damagetitle")
       for (let title of titles){
           title.classList.toggle("active")
       }
      }

   for (let obj in SchadenProps) {
       const SchadenObj = SchadenProps[obj]
       const SchadenObjName = SchadenObj["Schaden"]["value"]
       const SchadenVersion = SchadenObj["SchadenVersion"]["value"]

       const SchadenObjEle = document.createElement("div")
       SchadenObjEle.classList.add("damagetitle")
       SchadenObjEle.classList.add("nested")

       propertyCont.appendChild(SchadenObjEle)

       await createVersionInfos(SchadenObjName, SchadenObjEle, SchadenVersion, viewer, aoimodelid)
    }
  }

    const titleOtherData = document.createElement("h4");
    titleOtherData.textContent = `Verknüpfte Daten`;
    elebox.appendChild(titleOtherData);

    const otherDataDiv= document.createElement("div")
    elebox.appendChild(otherDataDiv)

/*
   const otherDataRes = await damagePicture(BauteilForPic)
    console.log(otherDataRes)
    const pictureViewer = document.getElementById("pictureViewer");

    const picPath = otherDataRes["results"]["bindings"]
    if (picPath.length > 0) {

        for (let o in otherDataRes["results"]["bindings"]) {
            console.log(o)
            const picDiv = document.createElement("div")
            picDiv.classList.add("damageimgCont")
            otherDataDiv.appendChild(picDiv)

            const picPathString = otherDataRes["results"]["bindings"][o]["fotofilename"]["value"]
            console.log(picPathString)
            const picRelPath = "ICDD_TwinGenDemo_anonym/Payload Documents/" + picPathString
            picDiv.style.padding = "0rem"
            const pic = document.createElement("img")
            pic.setAttribute("src", picRelPath)
            pic.setAttribute("alt", "document Picture")
            pic.classList.add("damageimg")
            pic.onclick = () => {
                removeAllChildren(pictureViewer)
                const closebutton = document.createElement("button")
                pictureViewer.appendChild(closebutton)
                closebutton.classList.add("closePic")
                const closebuttonicon = document.createElement("i")
                closebutton.appendChild(closebuttonicon)
                closebuttonicon.classList.add("material-icons")
                closebuttonicon.textContent = "close"
                closebutton.onclick = () => {
                    pictureViewer.style.display = "none"
                }

                pictureViewer.style.display = "flex";
                const detPic = document.createElement("img")
                detPic.setAttribute("src", picRelPath)
                const picName = document.createElement("div")
                picName.textContent = picRelPath
                pictureViewer.appendChild(detPic)
                pictureViewer.appendChild(picName)
            }
            picDiv.appendChild(pic)

        }

    } */

    elebox.style.display = "flex"
}



/*/ TODO not working : map targeted file not supported
//async function setUpMultiThreading() {
//    const manager =  await viewer.IFC.loader.ifcManager;
//    await manager.useWebWorkers(true, '/wasm/IFCWorker.js');
//}
//setUpMultiThreading();

*/

async function createVersionInfos(SchadenObjName, SchadenObjEle, SchadenVersion, viewer, aoimodelid){

       const SchadenObjEleName = document.createElement("span")
       SchadenObjEleName.classList.add("caret-new")
       SchadenObjEleName.classList.add("damagetitleclick")

       //SchadenObjEleName.id = SchadenObjName
       SchadenObjEleName.textContent = SchadenObjName.split("#")[1]
       SchadenObjEle.appendChild(SchadenObjEleName)


       SchadenObjEleName.onclick = () => {
           SchadenObjEleName.classList.toggle("caret-down")
           //const previewDamages =  document.getElementsByClassName(SchadenObjName.split("#")[1].slice(0,7));
           const previewDamages =  document.getElementsByClassName(SchadenObjName);
           for (let res of previewDamages){
               if(res.classList.contains("damage-preview")) {
                   res.classList.toggle("damage-preview-highlight")
               }
           }
           const nestedChilds = SchadenObjEleName.parentElement.childNodes
           for (let child of nestedChilds) {
               child.classList.toggle("active")
           }
       }
       const SchadenVersionName = document.createElement("div")
       const SchadenObjNameShort = SchadenObjName.split("#")[1]

       SchadenVersionName.textContent = "Version: " + SchadenVersion.split("#")[1]
       SchadenVersionName.classList.add("nested")
       SchadenVersionName.classList.add("damageVersion")
       SchadenObjEle.appendChild(SchadenVersionName)

      const schadenDetails = await damageDetails(SchadenVersion)
      const schadenTables = createEleInfoTable(schadenDetails)

      for (let table of schadenTables){
          table.classList.add("nested")
          SchadenObjEle.appendChild(table)
      }

      const container = document.createElement("div")
      container.classList.add("nested")
      SchadenObjEle.appendChild(container)

      const bottomcontainer = document.createElement("div")
      bottomcontainer.classList.add("damgageBottomContainer")
      container.appendChild(bottomcontainer)


     const picDiv = document.createElement("div")
     picDiv.classList.add("damageimgCont")
     bottomcontainer.appendChild(picDiv)

     await createPicture(SchadenVersion,picDiv,SchadenObjNameShort)

      const damageLocationTexts = await modeldamageTextAreas(SchadenObjNameShort);

      const locationDiv = document.createElement("div")
      locationDiv.classList.add("locationContainer")
      bottomcontainer.appendChild(locationDiv)
      const locationicon = document.createElement("i")
      locationicon.classList.add("material-symbols-outlined")
      locationicon.classList.add("locationIcon")
      locationDiv.appendChild(locationicon)

      if (damageLocationTexts["results"]["bindings"].length >0) {

          locationicon.textContent = "location_on"

          for (let res in damageLocationTexts["results"]["bindings"]) {
              const locText = damageLocationTexts["results"]["bindings"][res]["Ortsangabe"]["value"]
              const textEle = document.createElement("p")
              const splitText = locText.split("_")
              textEle.textContent = splitText[splitText.length-1]
              textEle.id = locText
              locationDiv.appendChild(textEle)
          }

          const expressids = []
          const modelAreaRes = await modeldamageAreas(SchadenObjNameShort)
          if (modelAreaRes["results"]["bindings"].length >0) {

              for (let res in modelAreaRes["results"]["bindings"]) {
                  const guid = modelAreaRes["results"]["bindings"][res]["guid"]["value"]
                  const expressid = getExpressId(guid, aoiproperties)
                  expressids.push(expressid)
              }

              if (expressids.length > 0) {
                const highlightbutton = document.createElement("button")
                highlightbutton.textContent = "Zeige Schadensbereich"
                highlightbutton.classList.add("boxbutton")
                locationDiv.appendChild(highlightbutton)

                highlightbutton.onclick = async() => {
                  const subset = await createSubsetofDamage(expressids,aoimodelid, viewer)
                 }
              }
          }
         }

        else    {
            locationicon.textContent = "location_off"
            const note = document.createElement("span")
            note.textContent = "Kein Schadensbereich \n"+
                                "definiert \\ Schaden \n"+
                                "betrifft gesamtes Bauteil"
            locationDiv.appendChild(note)
            locationDiv.style.width = "10rem"
         }

       const newAndOldVersions = await damageVersions(SchadenVersion)

       const versionbox = document.createElement("div")
       versionbox.classList.add("versionContainer")
       bottomcontainer.appendChild(versionbox)

       const versionicon = document.createElement("i")
        versionicon.classList.add("material-symbols-outlined")
        versionicon.classList.add("locationIcon")
        versionicon.textContent = "swap_horiz"
        versionbox.appendChild(versionicon)

       const previous = document.createElement("div")
       previous.classList.add("boxbutton")
       previous.textContent = "<< vorherige Version"
       versionbox.appendChild(previous)
       const next = document.createElement("div")
       next.classList.add("boxbutton")
       next.textContent = "nächste Version >>"
       versionbox.appendChild(next)

        try{
            const previousVersion = newAndOldVersions["results"]["bindings"]["0"]["vorherigeVersion"]["value"]
            previous.id = previousVersion
        }
        catch (e){
            previous.classList.add("inactive")
        }

        try{
            const nextVersion = newAndOldVersions["results"]["bindings"]["0"]["naechsteVersion"]["value"]
            next.id = nextVersion
        }
        catch (e){
            next.classList.add("inactive")
        }

        previous.onclick = async() => {
            if (previous.id) {
                await updateVersionInfo(SchadenObjName, SchadenObjEle, previous.id, viewer, aoimodelid)
            }
        }

        next.onclick = async() => {
            if (next.id) {
                await updateVersionInfo(SchadenObjName, SchadenObjEle, next.id, viewer, aoimodelid)
            }
        }

        return SchadenObjEle

}

async function updateVersionInfo (SchadenObjName, SchadenObjEle, SchadenVersion, viewer, aoimodelid){
    removeAllChildren(SchadenObjEle)
    const newEle = await createVersionInfos(SchadenObjName, SchadenObjEle, SchadenVersion, viewer, aoimodelid)
    const nestedElements = newEle.querySelectorAll(".nested")
    for (let nestedEle of nestedElements){
        nestedEle.classList.toggle("active")
    }
}

export async function createPicture(SchadenVersion, picDiv, SchadenObjNameShort) {

    const picPathRes = await damagePicture(SchadenVersion)
    const picPath = picPathRes["results"]["bindings"]

    const pictureViewer = document.getElementById("pictureViewer");

    if (picPath.length > 0) {
        const picPathString = picPath["0"]["fotofilename"]["value"]
        const picRelPath = "ICDD_TwinGenDemo_anonym/Payload Documents/" + picPathString
        picDiv.style.padding = "0rem"
        const pic = document.createElement("img")
        pic.setAttribute("src", picRelPath)
        pic.setAttribute("alt", "damage Picture")
        pic.classList.add("damageimg")
        pic.onclick = () => {
            removeAllChildren(pictureViewer)
            const closebutton = document.createElement("button")
            pictureViewer.appendChild(closebutton)
            closebutton.classList.add("closePic")
            const closebuttonicon = document.createElement("i")
            closebutton.appendChild(closebuttonicon)
            closebuttonicon.classList.add("material-icons")
            closebuttonicon.textContent = "close"
            closebutton.onclick = () => {
                pictureViewer.style.display = "none"
            }

            pictureViewer.style.display = "flex";
            const detPic = document.createElement("img")
            detPic.setAttribute("src", picRelPath)
            const picName = document.createElement("div")
            picName.textContent = SchadenObjNameShort + " : " + picRelPath
            pictureViewer.appendChild(detPic)
            pictureViewer.appendChild(picName)
        }
        picDiv.appendChild(pic)

    } else {
        const nopicicon = document.createElement("i")
        nopicicon.classList.add("material-symbols-outlined")
        nopicicon.classList.add("locationIcon")
        nopicicon.textContent = "no_photography"
        picDiv.appendChild(nopicicon)
        //const otherPicButton = document.createElement("button")
        //otherPicButton.classList.add("boxbutton")
        //otherPicButton.textContent = "alternatives Bild laden"
        //picDiv.appendChild(otherPicButton)
    }
}

export async function createEleBoxForDamageInfo (SchadenObjName, SchadenVersion, viewer, aoimodelid){
    const elebox = document.getElementById("element-info");
    removeAllChildren(elebox);
    addCloseButton(elebox);
    const SchadenObjEle = document.createElement("div")
    SchadenObjEle.classList.add("damagetitle")
    elebox.appendChild(SchadenObjEle)
    await createVersionInfos(SchadenObjName, SchadenObjEle, SchadenVersion, viewer, aoimodelid)
    const nestedChilds = SchadenObjEle.childNodes
           for (let child of nestedChilds) {
               child.classList.toggle("active")
           }
    elebox.style.display = "flex";
}


function addCloseButton (elebox) {
    const closebutton = document.createElement("button")
    elebox.appendChild(closebutton)
    closebutton.classList.add("close")
    const closebuttonicon = document.createElement("i")
    closebutton.appendChild(closebuttonicon)
    closebuttonicon.classList.add("material-icons")
    closebuttonicon.textContent = "close"
    closebutton.onclick = () => {
        elebox.style.display = "none"
    }
}

function addCloseButton2 (elebox) {
    const closebutton = document.createElement("button")
    elebox.appendChild(closebutton)
    closebutton.classList.add("close")
    const closebuttonicon = document.createElement("i")
    closebutton.appendChild(closebuttonicon)
    closebuttonicon.classList.add("material-icons")
    closebuttonicon.textContent = "close"
    closebutton.onclick = () => {
        elebox.style.height = "0";
        elebox.style.zIndex = "0";
    }
}


function addBackButton () {
    const addbutton = document.createElement("button")
    addbutton.classList.add("back")
    const addbuttonicon = document.createElement("span")
    addbutton.appendChild(addbuttonicon)
    addbuttonicon.classList.add("material-icons")
    addbuttonicon.textContent = "arrow_back"
    return addbutton
}

const previous = []
async function createDetailedInfoBox(guid){
    previous.push(guid)
    console.log(previous, guid)
    const detailBox = document.getElementById("detail-info")
    const title = document.createElement("h4");
    title.textContent = `Detaillierte Elementinformationen`;
    detailBox.style.height = "40%";
    detailBox.style.zIndex = "1"

    const backbutton = addBackButton()
    backbutton.onclick = async () => {
        removeAllChildren(detailBox)
        const oldvalue = previous[previous.length -2]
        console.log("click", oldvalue)
        const descRes2 = await describeElement(oldvalue)
        detailBox.appendChild(title)
        addCloseButton2(detailBox)
        detailBox.appendChild(backbutton)
        const table2 = createEleInfoTableForDescribeQuery(descRes2)
        detailBox.appendChild(table2)
        previous.push(oldvalue)
    }

    const descRes = await describeElement(guid)
    removeAllChildren(detailBox)
    detailBox.appendChild(title)
    addCloseButton2(detailBox)
    detailBox.appendChild(backbutton)
    const table = createEleInfoTableForDescribeQuery(descRes)
    detailBox.appendChild(table)

}