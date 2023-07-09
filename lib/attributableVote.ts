import { SupportDetailed } from '../types/Vote';
import { nounsDaoLogicV2ABI } from '../abis/generated/nounsDAOLogicV2';
import { viem } from './wagmi';
import { WalletClient, getFunctionSelector } from 'viem';

export const vote = async (
  wallet: WalletClient,
  proposalId: bigint,
  support: SupportDetailed,
  reason: string,
  client: string
) => {
  try {
    const { request } = await viem.simulateContract({
      address: '0x6f3E6272A167e8AcCb32072d08E0957F9c79223d',
      abi: nounsDaoLogicV2ABI,
      functionName: 'castRefundableVoteWithReason',
      args: [proposalId, support, reason],
    });
    request.dataSuffix = getFunctionSelector(client);
    const hash = await wallet.writeContract(request);

    return hash;
  } catch (e) {
    console.log(e);
    return null;
  }
};
