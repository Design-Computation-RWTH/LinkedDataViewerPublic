import {BufferAttribute, BufferGeometry, Color, Mesh} from 'three';
import {IfcViewerAPI} from 'web-ifc-viewer';

import {
    getAllDamagesOfYear,
    getAllInspections,
    getDamageOfPointGuid,
    damageDetails,
    damageRatings
} from './func/rdfquery';

import {createInfoBox, createSideTabs, createTreeMenu, setupPreview, setupDialog, createPicture, removeAllChildren,createEleBoxForDamageInfo, createPrufTree, createSIBTree} from './func/htmlCreation';

import {pointMat} from './func/materials';

import {computeBoundingBoxOfSubset, createSubsetofPoint, getCenterPoint, getGuid, hideSite} from './func/ifcFunc';


async function loadIfc(url) {
    const model = await viewer.IFC.loadIfcUrl(url, false, setupProgressNotification);
    await viewer.shadowDropper.renderShadow(model.modelID);
    return await model
}

function setupProgressNotification(event) {
    const loadingText = document.createElement('p');
    loadingElem.appendChild(loadingText)
      const percent = event.loaded / event.total * 100;
      const result = Math.trunc(percent);
      const formatted = result.toString()
      loadingText.textContent = `Loading: ${formatted}%`;
}

async function loadmodel (filepath)  {
    const model = await loadIfc(filepath)
    model.renderOrder = 0
    loadingElem.style.display = 'none'
    return await model
}

async function loadpointmodel () {
    const model = await loadIfc("ICDD_TwinGenDemo_anonym/Payload Documents/Models/damage_point_representation.ifc")
    return await model
}

async function loadaoimodel() {
    const model = await loadIfc("ICDD_TwinGenDemo_anonym/Payload Documents/Models/damageAreas.ifc")
    return await model
}

function unclickModel (viewer, aoimodel) {
    const items = viewer.context.items;
    items.pickableIfcModels = items.pickableIfcModels.filter(model => model !== aoimodel)
    items.ifcModels = items.ifcModels.filter(model => model !== aoimodel)
     aoimodel.removeFromParent()
}

let Jahr

const PrufRes =  await getAllInspections()
const PrufJahre = []
for (let res in PrufRes["results"]["bindings"]){
    PrufJahre.push(PrufRes["results"]["bindings"][res]["Jahr"]["value"])
}
Jahr = PrufJahre[PrufJahre.length -1]

//year slider
const slidecontainer = document.getElementById("slidecontainer");
const slider = document.createElement("input")
slider.type = "range"
slider.min = "0"
slider.max = (PrufJahre.length-1).toString()
slider.className = "slider"
slidecontainer.appendChild(slider)

const output = document.createElement("span")
slidecontainer.appendChild(output)
output.id = "YearValue"
output.innerHTML = Jahr


const checkCont = document.getElementById("checkboxcont")
const hidecheck = document.createElement("input")
hidecheck.classList.add("checkbox")
const hidechecklabel = document.createElement("label")
checkCont.appendChild(hidecheck)
checkCont.appendChild(hidechecklabel)
hidecheck.type = "checkbox"
hidecheck.checked = false
hidechecklabel.for = hidecheck
hidechecklabel.textContent = "Schäden aus anderen Jahren ausblenden"

hidecheck.onchange = () =>{
    editDamagePointInfos(Jahr, hidecheck.checked, analyzetoggle.checked)
}

slider.oninput = function() {
    output.innerHTML =  PrufJahre[this.value]
    Jahr = PrufJahre[this.value]
    editDamagePointInfos(Jahr, hidecheck.checked, analyzetoggle.checked )
}


const container = document.getElementById('three-canvas');
const loadingElem = document.getElementById('loader-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });

viewer.IFC.setWasmPath("/LinkedDataViewerPublic/wasm/");
viewer.axes.setAxes();
viewer.grid.setGrid();
viewer.context.renderer.postProduction.active = true;
viewer.clipper.active = true;

container.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
container.onclick = () => viewer.IFC.selector.pickIfcItem(true);

const scene = viewer.context.getScene()

await viewer.IFC.loader.ifcManager.applyWebIfcConfig({
 COORDINATE_TO_ORIGIN: true,
 USE_FAST_BOOLS: true
                   });

const bridgemodel = await loadmodel("/LinkedDataViewerPublic/ICDD_TwinGenDemo_anonym/Payload Documents/Models/IfcBridgeConverted_materials.ifc")


let aoimodel
let pointmodel
let aoimodelid

if (bridgemodel) {
    pointmodel = await loadpointmodel()
    pointmodel.material = pointMat
    pointmodel.renderOrder = 1
    aoimodel = await loadaoimodel()
    aoimodelid = aoimodel.modelID
    const ifcProject = await viewer.IFC.getSpatialStructure(bridgemodel.modelID);
    createTreeMenu(ifcProject, bridgemodel.modelID, viewer, aoimodelid, Jahr);
    unclickModel(viewer, aoimodel)
}

const rawifcProperties = await fetch('/LinkedDataViewerPublic/static/IfcProperties.json');
const bridgeproperties = await rawifcProperties.json();

const rawPointProperties = await fetch('/LinkedDataViewerPublic/static/pointIfcProperties.json');
const pointproperties = await rawPointProperties.json();

createSideTabs()
createPrufTree(viewer, aoimodelid)
createSIBTree(viewer, aoimodelid, Jahr, bridgeproperties)



container.ondblclick = () => getIDonClick(viewer)

async function getIDonClick (viewer){
    const res = viewer.context.castRayIfc();
    if(res) {
        const manager = viewer.IFC.loader.ifcManager;
        const id = manager.getExpressId(res.object.geometry, res.faceIndex);
        const modelID = viewer.IFC.getModelID()
        const props = await viewer.IFC.getProperties(modelID, id, true, false);
        const globalId = props.GlobalId.value
        await createInfoBox(globalId, viewer,aoimodelid,Jahr)
    }
}

const pointPos = Array.from(new Set(pointmodel.geometry.attributes.expressID.array))
for (let exid of pointPos){
    const subset = createSubsetofPoint([exid],pointmodel.modelID, viewer)
    const vertices = computeBoundingBoxOfSubset(subset)
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    subset.removeFromParent()
    const mesh = new Mesh(geometry);
    const center = getCenterPoint(mesh)

    const guid = getGuid(exid, pointproperties)
    const damageObjRes = await getDamageOfPointGuid(guid, Jahr)
    const damageobj = damageObjRes["results"]["bindings"]["0"]["damageobj"]["value"]
    const schadenid = damageObjRes["results"]["bindings"]["0"]["SchadenID"]["value"]

    const container = setupDialog(pointmodel, center)
    container.classList.add("previewContainer")
    container.classList.add(damageobj)

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

    const divEle =setupPreview(pointmodel, center, container);
    divEle.classList.add(damageobj)
    divEle.textContent= schadenid
}

editDamagePointInfos(Jahr)

async function editDamagePointInfos (PrufJahr, hide, analyze){
    const allpreviews = document.getElementsByClassName("damage-preview")
    for (let preview of allpreviews){
        if (hide === true){
            preview.classList.add("collapsed")
            preview.classList.remove("selectable")
        }
        else{
            preview.classList.add("nonselectable")
            preview.classList.remove("selectable")
        }
    }

    const allDamagesofYearRes = await getAllDamagesOfYear(PrufJahr)
    for (let res in allDamagesofYearRes["results"]["bindings"]) {
        const yearDamObj = allDamagesofYearRes["results"]["bindings"][res]["Schaden"]["value"]
        const yearDam = allDamagesofYearRes["results"]["bindings"][res]["SchadenVersion"]["value"]
        const damprops = await damageDetails(yearDam)

        const damdivs = document.getElementsByClassName(yearDamObj.toString())
        let preview
        let previewContainer
        for(let div of damdivs){
            if (div.classList.contains("damage-preview") === true){
                preview = div
                div.classList.remove("collapsed")
                div.classList.remove("nonselectable")
                div.classList.remove("analyzeColorGreen")
                div.classList.remove("analyzeColorYellow")
                div.classList.remove("analyzeColorRed")
                if (analyze === true){
                    const ratingRes = await damageRatings(yearDam)
                    console.log(ratingRes)
                    const ratingArr = []
                    for(let ratingType in ratingRes["results"]["bindings"]["0"]){
                        const ratingTypeObj = ratingRes["results"]["bindings"]["0"][ratingType]
                        const rating = ratingTypeObj["value"]
                        ratingArr.push(rating)
                    }
                    let countzeros = 0;
                    for(let i = 0; i < ratingArr.length; ++i){
                        if(ratingArr[i] === "0")
                            countzeros++;
                    }
                    console.log(countzeros)
                    if(countzeros === 3){
                        preview.classList.add("analyzeColorGreen")
                     }
                    else if (countzeros === 2){
                        preview.classList.add("analyzeColorYellow")
                     }
                    else{
                        preview.classList.add("analyzeColorRed")
                     }
                    }
                else{
                    div.classList.add("selectable")
                }
                div.onclick =async() => {
                    await createEleBoxForDamageInfo(yearDamObj,yearDam,viewer,aoimodelid)
                }

            }
            if (div.classList.contains("previewContainer")=== true){
                previewContainer = div
                const pic = previewContainer.getElementsByClassName("previewPicture")[0]
                removeAllChildren(pic)
                await createPicture(yearDam,pic,yearDamObj.split("#")[1])
                const bauteilDiv = previewContainer.getElementsByClassName("previewNote")[0]
                removeAllChildren(bauteilDiv)
                const entries = []
                try {
                    const bauteil = damprops["results"]["bindings"]["0"]["Bauteil"]["value"]
                    entries.push(bauteil)
                    const konteil = damprops["results"]["bindings"]["0"]["Konstruktionsteil"]["value"]
                    entries.push(konteil)
                    const gruppe = damprops["results"]["bindings"]["0"]["Bauteilgruppe"]["value"]
                    entries.push(gruppe)
                }
                catch (e){
                }
                for (let e of entries){
                    const text = document.createElement("div")
                    text.textContent = e.split("_")[1]
                    bauteilDiv.appendChild(text)
                }

                const artDiv = previewContainer.getElementsByClassName("previewArt")[0]
                removeAllChildren(artDiv)
                const schaden = damprops["results"]["bindings"]["0"]["Schadenart"]["value"]
                const art = document.createElement("div")
                art.textContent= schaden.split("#")[1]
                artDiv.appendChild(art)
            }
        }

    }
}

const IFCTreeNodes = document.getElementsByClassName("leaf-node")
for (let leaf of IFCTreeNodes){
    leaf.onclick = async () => {
        await createInfoBox(leaf.id, viewer, aoimodelid, Jahr)
    }
}

const SIBTreeNodes = document.getElementsByClassName("sibtree-element")
for (let node of SIBTreeNodes){
    node.onclick = async () => {
        await createInfoBox(node.id, viewer, aoimodelid, Jahr)
    }
}


const hidebutton = document.getElementById("visibility")
const hidebuttonicon = document.createElement("i")
hidebuttonicon.classList.add("material-symbols-outlined")
hidebuttonicon.textContent = "visibility"
hidebutton.appendChild(hidebuttonicon)

hidebutton.onclick = () => {
    if (hidebuttonicon.textContent === "visibility"){
    hideSite(bridgemodel,bridgeproperties, viewer)
    hidebuttonicon.textContent = "visibility_off"}
    else {
        scene.add(bridgemodel)
        hidebuttonicon.textContent = "visibility"
    }
}

const cutbutton = document.createElement("button")
cutbutton.classList.add("bottom-button")
//buttoncontainer.appendChild(cutbutton)
const cutbuttonicon = document.createElement("i")
cutbuttonicon.classList.add("material-symbols-outlined")
cutbuttonicon.textContent = "cut"
cutbutton.appendChild(cutbuttonicon)

cutbutton.onclick = () => {
    viewer.clipper.createPlane();
    viewer.clipper.deletePlane();
}


const analyzeSwitch = document.getElementById("analyzeSwitch")

const analyzebuttonicon = document.createElement("span")
analyzebuttonicon.classList.add("material-icons")
analyzebuttonicon.classList.add("analyzebutton")
analyzebuttonicon.textContent = "troubleshoot"
analyzeSwitch.appendChild(analyzebuttonicon)

const analyzetoggle = document.getElementById("analyzeCheck")
analyzetoggle.checked = false
analyzetoggle.onchange = () =>{
   console.log(analyzetoggle.checked)
   editDamagePointInfos(Jahr, hidecheck.checked, analyzetoggle.checked )
}

const header = document.getElementsByTagName("header")

const helpbutton = document.createElement("button")
helpbutton.id = "helpbutton"
header[0].appendChild(helpbutton)
const helpbuttonicon = document.createElement("i")
helpbuttonicon.classList.add("material-symbols-outlined")
helpbuttonicon.textContent = "question_mark"
helpbutton.appendChild(helpbuttonicon)

helpbutton.onmouseover = () => {
    const othertext = document.getElementsByClassName("infotext")
    for (let i of othertext) {
        i.style.display="none"
    }
    const helptext = document.getElementById("helptext")
    console.log(helptext)
    helptext.style.display="block"
}

helpbutton.onmouseleave = () => {
    const helptext = document.getElementById("helptext")
    helptext.style.display="none"
}

const contactbutton = document.createElement("button")
contactbutton.id = "contact"
header[0].appendChild(contactbutton)
const contactbuttonicon = document.createElement("i")
contactbuttonicon.classList.add("material-symbols-outlined")
contactbuttonicon.textContent = "person"
contactbutton.appendChild(contactbuttonicon)

contactbutton.onmouseover = ()=> {
    const contactinfo = document.getElementById("contactinfo");
    contactinfo.style.display="block";
    contactinfo.onmouseleave = () =>{
        contactinfo.style.display="none"
    }
}
