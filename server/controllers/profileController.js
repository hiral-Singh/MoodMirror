export const updateProfile = async (req, res) => {
  try {
    const { name, age, location, profilePic } = req.body;

    if (name !== undefined) req.user.name = name.trim();
    if (age !== undefined) req.user.age = age || null;
    if (location !== undefined) req.user.location = location.trim();
    if (profilePic !== undefined) req.user.profilePic = profilePic.trim();

    await req.user.save();

    return res.status(200).json({ user: req.user.toSafeObject() });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update profile" });
  }
};
