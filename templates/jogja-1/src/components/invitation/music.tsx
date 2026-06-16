import { Audio, useInvitationStore } from '@temanten/sdk';

export const InvitationAudio = () => {
  const { data: { musicUrl: src } } = useInvitationStore();
  return <Audio src={src} />;
};