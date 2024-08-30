export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer className="mt-10 bg-primary text-white">
        <div className="mx-auto flex max-w-screen-xl justify-between gap-4 p-16">
          <p>
            Created with 💓 by{" "}
            <a
              className="hover:underline"
              href="https://polv.dev"
              target="_blank"
            >
              Pol Vallverdu
            </a>
            .
          </p>
          <p>
            © 2024{" "}
            <a
              className="hover:underline"
              href="https://wosher.co"
              target="_blank"
            >
              wosher.co
            </a>
            . All Rights Reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
