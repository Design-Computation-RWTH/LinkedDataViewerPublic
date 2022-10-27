import {MeshBasicMaterial, MeshLambertMaterial} from "three";

export const selectionMaterial = new MeshLambertMaterial(
    {
        color: "#41a6d0",
        transparent: "true",
        opacity: 0.3,
    }
)

export const preselectionMaterial = new MeshLambertMaterial(
    {
        color: "#41a6d0" ,
        transparent: "true",
        opacity: 0.7,
    }
)

export const damareaMat = new MeshBasicMaterial(
    {
        color: "red",
        transparent: true,
        opacity: 0.5,
        depthTest: false,
    }
)

export const pointMat = new MeshLambertMaterial(
    {
        color: "red",
        transparent: false,
        depthTest: false,
    }
)


