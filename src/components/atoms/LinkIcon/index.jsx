import PropTypes from "prop-types";
const LinkIcon = (props) => {
  const { link, target, src, altText, height, width } = props;

  return (
    <>
      <a target={target} href={link}>
        <img src={src} alt={altText} style={{ height: height, width: width }} />
      </a>
    </>
  );
};
LinkIcon.propTypes = {
  link: PropTypes.string,
  target: PropTypes.string,
  src: PropTypes.node,
  altText: PropTypes.string,
  height: PropTypes.number,
  width: PropTypes.number,
};
export default LinkIcon;
