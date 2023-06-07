import Head from 'next/head';
import { FallbackProp } from '../lib/util/swr';
import { SWRConfig } from 'swr';
import React, { useState } from 'react';
import { ConnectKitButton } from 'connectkit';
import HeadSVG from '../public/noun652head.svg';
import Image from 'next/image';
import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { VoteModal } from './VoteModal';

type PageProps = {
  title: string;
  children?: JSX.Element;
  fallback?: FallbackProp;
};

export function Page({ children, title: pageTitle, fallback = {} }: PageProps) {
  const [showModal, setShowModal] = useState(false);
  const toggleModal = () => setShowModal(!showModal);

  const title = pageTitle + ' - voter.wtf';
  return (
    <SWRConfig value={{ fallback }}>
      <main>
        <Head>
          <title>{title}</title>
        </Head>
        <header className="bg-gray-900 md:bg-transparent z-10 fixed top-0 right-0 w-full">
          <Link href="/" className="flex justify-between w-full">
            <div className="bg-gray-900 ml-8 justify-start">
              <Image
                src={HeadSVG}
                alt="Noun652 Head"
                className="w-auto h-12"
                width={48}
                height={48}
              />
              <h1 className="neon mb-4 md:mb-0">VwR</h1>
            </div>
            <button
              onClick={toggleModal}
              className="mr-4 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <PencilSquareIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="m-4 flex justify-end">
              <ConnectKitButton />
            </div>
          </Link>
        </header>
        {showModal && <VoteModal proposalIds={[0, 1]} initialProposalId={1} />}

        <div className="bg-gray-900 min-h-screen text-white font-sans pt-20">
          {children}
        </div>
      </main>
    </SWRConfig>
  );
}
