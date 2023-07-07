import React, { useEffect, useMemo, useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { getNounsLink } from '../lib/util/link';
import { clsx as classNames } from 'clsx';
import { useIsMounted } from '../hooks/useIsMounted';
import { TimeAgo } from './TimeAgo';
import { useBlockTimestamp } from '../hooks/useBlockTimestamp';
import axios from 'axios';
import Image from 'next/image';
import { Like, Vote } from '../types/Vote';
import Link from 'next/link';
import { Markdown } from './Markdown';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useVoteDetail } from '../hooks/useVoteDetail';
import { useShowVoteModal } from '../hooks/useShowVoteModal';
import { useVotableProposals } from '../hooks/useVotableProposals';
import { resolveNnsName } from '../lib/nns';

interface VoteReasonProps {
  vote: Vote;
}

export function VoteReasons({ vote }: VoteReasonProps) {
  const isMounted = useIsMounted();
  const { data: timestamp } = useBlockTimestamp(
    BigInt(vote.blockNumber ? vote.blockNumber : 0)
  );
  const { data: walletClient } = useWalletClient();
  const { address: account } = useAccount();
  const [liked, setLiked] = useState(false);
  const [voterLikes, setVoterLikes] = useState<Like[]>([]);
  const [nonVoterLikes, setNonVoterLikes] = useState<Like[]>([]);
  const { setVoteDetail } = useVoteDetail();
  const { setShowVoteModal } = useShowVoteModal();
  const proposals = useVotableProposals();

  const isVotable = useMemo(() => {
    if (!proposals || !vote.proposal.id) return false;
    return proposals.some(p => p.id === vote.proposal.id);
  }, [proposals, vote.proposal.id]);

  const publicClient = usePublicClient();
  const [nnsName, setNnsName] = useState<string | null>(null);

  useEffect(() => {
    const getNnsName = async () => {
      const name = await resolveNnsName(vote.voter.id, publicClient);
      setNnsName(name);
    };
    getNnsName();
  }, [vote.voter.id, publicClient]);

  const ensName = useMemo(
    () => (vote.voter.ensName ? vote.voter.ensName : vote.voter.id.slice(0, 8)),
    [vote.voter.id, vote.voter.ensName]
  );

  const handleLikeClick = async () => {
    if (liked || !walletClient) {
      return;
    }

    const message = `like vote by ${vote.voter.id} on ${vote.proposal.id}`;

    try {
      const signedMessage = await walletClient.signMessage({
        account,
        message: message,
      });
      setLiked(true);
      // TODO pass in some isNounHolder from the top level
      // and update vote count based on this
      const response = await axios.post('/api/likeVote', {
        prop_id: vote.proposal.id,
        voter: vote.voter.id,
        signed_message: signedMessage,
        user: account,
      });

      if (response.status != 200) {
        setLiked(false);
      }
    } catch (error) {
      setLiked(false);
      console.error('Error liking the vote:', error);
    }
  };

  useEffect(() => {
    if (!vote.likes) return;

    const vLikes: Like[] = [];
    const nVLikes: Like[] = [];

    for (const like of vote.likes) {
      if (like.is_nouns_voter) {
        vLikes.push(like);
      } else {
        nVLikes.push(like);
      }
      if (account && like.user === account) {
        setLiked(true);
      }
    }

    setVoterLikes(vLikes);
    setNonVoterLikes(nVLikes);
  }, [account, vote.likes]);

  if (!isMounted) return null;

  return (
    <div>
      <div
        className={`flex  p-3 mb-2 ${
          vote.reason ? 'bg-gray-800' : ''
        } rounded-lg shadow-md`}
      >
        <div className="mr-2">
          <Link href={`/voters/${encodeURIComponent(vote.voter.id)}`}>
            <div
              className={classNames(
                'rounded-full w-12 h-12 overflow-hidden transition-all border-transparent border-2 duration-100 hover:border-gray-500 box-border bg-gray-700'
              )}
            >
              {vote.voter.ensAvatar && <EnsImage url={vote.voter.ensAvatar} />}
            </div>
          </Link>
        </div>

        <div className="w-full">
          <div className="flex text-gray-300">
            <Link
              className="hover:underline"
              href={`/voters/${encodeURIComponent(vote.voter.id)}`}
            >
              {nnsName ? nnsName : ensName}
            </Link>
            {'  '}
            <span
              className={classNames(' ml-1 font-semibold', {
                'text-green-400': vote.supportDetailed == 1,
                'text-red-400': vote.supportDetailed == 0,
                'text-gray-400':
                  vote.supportDetailed !== 1 && vote.supportDetailed !== 0,
              })}
            >
              {' '}
              <span className=" w-5 rounded-full ">{vote.votes} </span>
              {vote.supportDetailed == 1
                ? 'FOR'
                : vote.supportDetailed == 0
                ? 'AGAINST'
                : 'ABSTAIN'}{' '}
            </span>
            <span className="text-gray-500 mx-1"> · </span>
            <TimeAgo
              className="text-gray-500"
              timestamp={timestamp || 0}
              as="div"
            />
          </div>
          <a
            href={getNounsLink(vote.proposal.id)}
            className="hover:underline text-gray-400 text-sm line-clamp-1"
            target="_blank"
            rel="noreferrer"
          >
            Prop {vote.proposal.id}: {vote.proposal.title}{' '}
          </a>

          <div className="mt-5 whitespace-pre-line break-words overflow-wrap mb-2 mt-2 text-gray-200">
            <Markdown text={vote.reason || ''} />
          </div>

          {vote.reason && (
            <div className={'flex items-center justify-end mr-2'}>
              <button
                onClick={() => {
                  setVoteDetail({
                    support: vote.supportDetailed,
                    reason: `reVoteWithReason from ${ensName}\n> ${vote.reason?.replace(
                      /\n\n/g,
                      '\n'
                    )} \n\n*sent from voter.wtf*`,
                    proposalId: vote.proposal.id.toString(),
                  });
                  setShowVoteModal(true);
                }}
              >
                {isVotable && account && (
                  <ArrowPathIcon className="h-5 w-5 text-gray-500 mr-2" />
                )}
              </button>
              <button
                onClick={handleLikeClick}
                disabled={!walletClient || liked}
                className={` ${
                  liked
                    ? ''
                    : 'transition duration-300 ease-in-out hover:bg-red-500 rounded-full'
                }`}
              >
                {liked ? (
                  <Image
                    height={30}
                    width={30}
                    alt="test"
                    src="/coloredNounHeart.svg"
                  />
                ) : (
                  <Image
                    height={30}
                    width={30}
                    alt="test"
                    src="/nounHeart.svg"
                  />
                )}
              </button>
              <p
                className={`ml-1 mb-1 font-semibold ${
                  voterLikes.length + nonVoterLikes.length == 0
                    ? 'text-gray-800'
                    : 'text-gray-500'
                }`}
              >
                {voterLikes.length + nonVoterLikes.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoteReasons;

function EnsImage({ url }: { url: string }) {
  const [error, setError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    setImageUrl('/api/image?url=' + encodeURIComponent(url));
  }, [url]);

  const handleError = () => {
    setError(true);
  };

  if (imageUrl == '') return null;

  return error ? (
    <div className="rounded-full w-12 h-12 bg-gray-700"></div>
  ) : (
    <Image
      src={imageUrl}
      width={48}
      height={48}
      alt={`Ens Avatar`}
      onError={handleError}
    />
  );
}
