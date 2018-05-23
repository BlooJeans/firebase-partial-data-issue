
export default ({ children }) => {
  return (
    <div className="pageLayout">
      {children}
      <style global jsx>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
