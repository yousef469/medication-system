
import { NodeIO } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3d';

async function inspect() {
    const io = new NodeIO()
        .registerExtensions(KHRONOS_EXTENSIONS)
        .registerDependencies({
            'draco3d.decoder': await draco3d.createDecoderModule(),
        });

    const doc = await io.read('public/skeleton_parts/central_skeleton.glb');
    const root = doc.getRoot();

    console.log('--- MESHES & NODES ---');
    root.listNodes().forEach(node => {
        const mesh = node.getMesh();
        if (mesh) {
            console.log(`Node: "${node.getName()}" | Mesh: "${mesh.getName()}"`);
        } else {
            console.log(`Node (No Mesh): "${node.getName()}"`);
        }
    });
}

inspect().catch(err => console.error(err));
