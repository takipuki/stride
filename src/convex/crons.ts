import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

// Run old pending image sweep every 24 hour
crons.interval('cleanup_old_pending_images', { hours: 24 }, internal.posts.cleanupOldPendingImages);

export default crons;
