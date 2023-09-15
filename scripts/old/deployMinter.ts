import { toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const minter = provider.open(
        Minter.createFromConfig(
            {
                id: Math.floor(Math.random() * 10000),
                counter: 0,
            },
            await compile('Minter')
        )
    );

    await minter.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(minter.address);

    console.log('ID', await minter.getID());
}
