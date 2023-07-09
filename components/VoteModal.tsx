import React, { useState, useEffect, useMemo } from 'react';
import { useNounsDaoLogicV2CastRefundableVoteWithReason as vwr } from '../abis/generated/nounsDAOLogicV2';
import { Markdown } from './Markdown';
import { SupportDetailed } from '../types/Vote';
import { useShowVoteModal } from '../hooks/useShowVoteModal';
import { useVoteDetail } from '../hooks/useVoteDetail';
import { useVotableProposals } from '../hooks/useVotableProposals';
import { pirsch } from '../lib/pirsch';
import { getFunctionSelector } from 'viem';
import { vote } from '../lib/attributableVote';
import { useWalletClient } from 'wagmi';

export function VoteModal() {
  const { data: walletClient } = useWalletClient();
  const { setShowVoteModal } = useShowVoteModal();
  const proposals = useVotableProposals();
  const { voteDetail, setVoteDetail } = useVoteDetail();
  const [preview, setPreview] = useState(false);
  const { isLoading, isSuccess, write } = vwr({
    args: [
      BigInt(voteDetail.proposalId),
      voteDetail.support,
      voteDetail.reason,
    ],
    dataSuffix: getFunctionSelector('voter.wtf'),
  });
  console.log(getFunctionSelector('voter.wtf'));

  const handleVote = () => {
    // write();
    vote(
      walletClient!,
      BigInt(voteDetail.proposalId),
      voteDetail.support,
      voteDetail.reason,
      'voter.wtf'
    );
  };

  useEffect(() => {
    if (isSuccess) {
      let proposalId = '';
      const otherProposals = proposals.filter(
        proposal => proposal.id.toString() != voteDetail.proposalId
      );
      if (otherProposals.length > 0) {
        proposalId = otherProposals[0].id.toString();
      }
      setVoteDetail({
        proposalId: proposalId,
        support: SupportDetailed.For,
        reason: '\n\n*sent from voter.wtf*',
      });
      pirsch('voted', {});
      setShowVoteModal(false);
    }
  }, [
    isSuccess,
    setShowVoteModal,
    proposals,
    setVoteDetail,
    voteDetail.proposalId,
  ]);

  const supportColor = useMemo(() => {
    switch (voteDetail.support) {
      case SupportDetailed.For:
        return 'text-green-500';
      case SupportDetailed.Abstain:
        return 'text-gray-500';
      case SupportDetailed.Against:
        return 'text-red-500';
      default:
        return 'text-white-500';
    }
  }, [voteDetail.support]);

  return (
    <div
      className="fixed z-10 inset-0 overflow-y-auto w-full h-full sm:w-auto sm:h-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="mt-2">
              <label
                htmlFor="proposal"
                className="block text-sm font-medium text-white"
              >
                Proposal
              </label>
              <select
                id="proposal"
                onChange={e =>
                  setVoteDetail({ ...voteDetail, proposalId: e.target.value })
                }
                value={voteDetail.proposalId}
                className="mt-1 p-2 block w-full bg-gray-700 text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-2"
              >
                {proposals.map(proposal => (
                  <option
                    key={proposal.id.toString()}
                    value={proposal.id.toString()}
                  >
                    {proposal.title}
                  </option>
                ))}
              </select>
              <label
                htmlFor="vote"
                className="block text-sm font-medium text-white mt-4"
              >
                Vote
              </label>
              <select
                id="vote"
                value={voteDetail.support}
                onChange={e =>
                  setVoteDetail({
                    ...voteDetail,
                    support: Number(e.target.value),
                  })
                }
                className={`mt-1 p-2 block w-full bg-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-2 ${supportColor}`}
              >
                <option value={SupportDetailed.For}>For</option>
                <option value={SupportDetailed.Against}>Against</option>
                <option value={SupportDetailed.Abstain}>Abstain</option>
              </select>
              <label
                htmlFor="reason"
                className="block text-sm font-medium text-white mt-4"
              >
                Reason
              </label>
              <div className="flex items-center mt-2">
                <button
                  className={`mr-2 p-2 text-white  ${
                    preview ? '' : 'bg-gray-700'
                  }`}
                  onClick={() => setPreview(false)}
                >
                  Edit
                </button>
                <button
                  className={`mr-2 p-2 text-white ${
                    preview ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setPreview(true)}
                >
                  Preview
                </button>
              </div>
              {!preview && (
                <textarea
                  id="reason"
                  value={voteDetail.reason}
                  onChange={e =>
                    setVoteDetail({ ...voteDetail, reason: e.target.value })
                  }
                  className="p-2 rounded-none block w-full bg-gray-700 text-white shadow-sm h-48"
                ></textarea>
              )}
              {preview && (
                <div
                  className=" p-4 bg-gray-700 text-white shadow-sm h-48 overflow-auto"
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  <Markdown text={voteDetail.reason} />
                </div>
              )}
            </div>
          </div>
          <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              disabled={isLoading}
              onClick={handleVote}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-gray-800 bg-gray-200 text-base font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {isLoading ? 'Check Wallet' : 'Vote'}
            </button>
            <button
              onClick={() => setShowVoteModal(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-700 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
