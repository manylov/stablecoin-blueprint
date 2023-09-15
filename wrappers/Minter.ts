import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano,
} from 'ton-core';

export type MinterConfig = {
    totalSupply: bigint;
    adminAddress: Address;
    managerAddress: Address;
    jettonWalletCode: Cell;
};

export function minterConfigToCell(config: MinterConfig): Cell {
    return beginCell()
        .storeCoins(config.totalSupply)
        .storeAddress(config.adminAddress)
        .storeAddress(config.managerAddress)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export const Opcodes = {
    internal_transfer: 0x178d4519,
    mint: 21,
    change_admin: 3,
    claim_admin: 4,
    upgrade: 5,
    call_to: 6,
    change_manager: 7,
};

export class Minter implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Minter(address);
    }

    static createFromConfig(config: MinterConfig, code: Cell, workchain = 0) {
        const data = minterConfigToCell(config);
        const init = { code, data };
        return new Minter(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendChangeAdmin(
        provider: ContractProvider,
        via: Sender,
        opts: {
            address: Address;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcodes.change_admin, 32).storeAddress(opts.address).endCell(),
        });
    }

    async sendClaimAdmin(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcodes.claim_admin, 32).endCell(),
        });
    }

    async sendChangeManager(
        provider: ContractProvider,
        via: Sender,
        opts: {
            address: Address;
            value: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(Opcodes.change_manager, 32).storeAddress(opts.address).endCell(),
        });
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        opts: {
            address: Address;
            value: bigint;
            amount: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.mint, 32) // mint opcode
                .storeUint(0, 64) // query id
                .storeCoins(toNano(0.2))
                .storeAddress(opts.address)
                .storeRef(
                    // internal transfer message
                    beginCell()
                        .storeUint(Opcodes.internal_transfer, 32)
                        .storeUint(0, 64)
                        .storeCoins(opts.amount)
                        .storeAddress(null) // TODO FROM?
                        .storeAddress(null) // TODO RESP?
                        .storeCoins(0)
                        .storeBit(false) // forward_payload in this slice, not separate cell
                        .endCell()
                )
                .endCell(),
        });
    }
}
