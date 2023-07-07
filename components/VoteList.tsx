import { Vote } from '../types/Vote';
import PaginatedVoteReason from './PaginatedVoteReason';

interface VoteListProps {
  votes: Vote[];
}

export const VoteList: React.FC<
  VoteListProps & { loadMoreRef?: (node: HTMLDivElement) => void }
> = ({ votes, loadMoreRef }) => {
  return (
    <div className="md:max-w-xl sm:max-w-full">
      {votes.map((vote, index) => {
        if (index === votes.length - 5) {
          return (
            <PaginatedVoteReason key={vote.id} vote={vote} ref={loadMoreRef} />
          );
        } else {
          return <PaginatedVoteReason key={vote.id} vote={vote} />;
        }
      })}
    </div>
  );
};
