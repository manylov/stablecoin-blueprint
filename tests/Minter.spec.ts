import { Blockchain, SandboxContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Minter', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Minter');
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        minter = blockchain.openContract(Minter.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await minter.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and minter are ready to use
    });
});
