import Audio from '#/models/Audio';
import AutoGeneratedPlaylist from '#/models/AutoGeneratedPlaylist';
import cron from 'node-cron';

/**
 * the five fields in the cron syntax represent
 * (in order) minutes, hours, day of the month,
 * month and day of the week.
 *
 */
// for example: */2 * * * * * => every 2 seconds

const generateAutoPlaylist = async () => {
  const result = await Audio.aggregate([
    { $sort: { likes: -1 } },
    {
      $sample: { size: 20 }, // $limit did not work here, $sample: {$size: 20} work correctly
    },
    {
      $group: {
        _id: '$category',
        audios: { $push: '$$ROOT._id' }, // categorized based on each category and its audios like this -> {_id: "Arts", audios: ["aacacacaca", "cacalc,alc,aca"]}
      },
    },
  ]);

  result.map(async (item) => {
    await AutoGeneratedPlaylist.findOneAndUpdate(
      {
        title: item?._id,
      },
      {
        $set: { items: item?.audios },
      },
      { upsert: true } // if AutoGeneratedPlaylist founded -> update / if did'nt find then -> created
    );
  });
};

cron.schedule('0 0 * * *', async () => {
  // will run every 24 hour
  await generateAutoPlaylist();
});
