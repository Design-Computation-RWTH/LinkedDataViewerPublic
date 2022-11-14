# Linked Data Viewer for the TwinGen Project

The viewer allows visualization and retrieval of existing structure and inspection data of a bridge. Linked information from a triplestore can be retrieved via the model and side panels.
An online version of the Viewer can be viewed here: 

https://design-computation-rwth.github.io/LinkedDataViewerPublic/

* * *

## Implementation 

To implement the viewer there are the following requirements:

1.  SIB-Bauwerke data converted to RDF and IFC model data  on any triplestore (see: https://github.com/AnneGoebels/SIB-Bauwerke-To-Linked-Data , https://github.com/AnneGoebels/DamageLocation ; and the related ontolgies: https://w3id.org/asbingowl/core , https://w3id.org/asbingowl/keys , https://w3id.org/asbingowl/keys/2013 ).
    (as example data see: ICDD > Payload Documents > RDF Data)
2.   IFC model of the bridge (see ICDD > Payload Documents > Models )
3.  ifc.js was used for the 3D representation. Here the wasm files in the corresponding folders must be replaced by the current ones from the current ifc.js version. (see documentation: https://ifcjs.github.io/info/docs/introduction )
    

* * *

## Acknowledgement

This research was funded by the German Federal Ministry of Digital and Transport. The SIB-Bauwerke data was provided by the Autobahn GmbH Sübayern.

* * *

## Author information

Anne Göbels (goebels@dc.rwth-aachen.de)



