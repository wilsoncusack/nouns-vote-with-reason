import React, { forwardRef } from 'react';
import { VoteReasons } from './VoteReasons';
import { Vote } from '../types/Vote';

type Props = {
  vote: Vote;
};

const PaginatedVoteReason: React.ForwardRefRenderFunction<
  HTMLDivElement,
  Props
> = ({ vote }, ref) => {
  return (
    <div ref={ref}>
      <VoteReasons vote={vote} />
    </div>
  );
};

export default forwardRef(PaginatedVoteReason);
