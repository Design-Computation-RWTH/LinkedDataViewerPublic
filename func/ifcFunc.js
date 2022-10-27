import {Vector3} from "three";
import {damareaMat} from "./materials.js";

async function loadScan(url) {
    const scan = await viewer.GLTF.load(url)
    loadingElem.style.display = 'none'
}
// TODO scan gltfs empty -> better scanfiles
//loadScan('/segment_0.gltf');

// Load properties
async function createJson (model) {
    const props = await viewer.IFC.properties.serializeAllProperties(model)
    const propsfile = new File(props, "IfcProperties")
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.href = URL.createObjectURL(propsfile);
    link.download = 'IfcProperties.json';
    link.click();
    link.remove();
}



export function getExpressId (guid, modelprops){
    let eid
    Object.entries(modelprops).map(entry => {
    let value = entry[1];
    if (value.GlobalId === guid) {
        eid = value.expressID
        }
    });
    return eid
}

export function getGuid (expressid, modelprops){
    let guid
    Object.entries(modelprops).map(entry => {
    let value = entry[1];
    if (value.expressID === expressid) {
        guid = value.GlobalId
        }
    });
    return guid
}

export function createSubsetofDamage (expressids,modelId, viewer) {
    viewer.IFC.selector.selection.unpick()
    const area = viewer.IFC.loader.ifcManager.createSubset(
    {modelID: modelId,
        scene: viewer.context.getScene(),
        ids: expressids,
        removePrevious: true,
        material: damareaMat}
    );
    return area
}

export function createSubsetofPoint (expressids,modelId, viewer) {
    const area = viewer.IFC.loader.ifcManager.createSubset(
    {modelID: modelId,
        scene: viewer.context.getScene(),
        ids: expressids,
        removePrevious: true,
        customID: expressids.toString()}
    );
    return area
}

export function computeBoundingBoxOfSubset (subset) {
    const coordinates = [];
    const alreadySaved = new Set();
    const position = subset.geometry.attributes.position;
    for (let index of subset.geometry.index.array) {
        if (!alreadySaved.has(index)) {
            coordinates.push(position.getX(index));
            coordinates.push(position.getY(index));
            coordinates.push(position.getZ(index));
            alreadySaved.add(index);
        }
    }
    const vertices = Float32Array.from(coordinates);
    return vertices
}

export function getCenterPoint(mesh) {
    const geometry = mesh.geometry;
    geometry.computeBoundingBox();
    const center = new Vector3();
    geometry.boundingBox.getCenter( center );
    mesh.localToWorld( center );
    return center;
}

const closeButtons = document.getElementsByClassName("close");
for (let closeButton of closeButtons){
    closeButton.onclick = () => {
        const par = closeButton.parentElement
        const pic = par.querySelector("img")
        if (pic){
            pic.remove()
        }
        const text = par.querySelector("div")
        if(text) {
            text.remove()
        }
        par.style.display = "none";
    }
}

export function hideSite (bridgemodel,bridgeproperties, viewer){
    bridgemodel.removeFromParent()
    const eids = []
    Object.entries(bridgeproperties).map(entry => {
        let value = entry[1];
        if(value.Name) {
            if (value.Name.includes("Unterregion") === false && value.Name.includes("Oberf") === false ) {
                eids.push(value.expressID)
            }
        }
    });
   viewer.IFC.loader.ifcManager.createSubset(
    {modelID: bridgemodel.modelID,
        scene: viewer.context.getScene(),
        ids: eids,
    });
}
