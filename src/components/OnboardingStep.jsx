import { motion } from 'framer-motion';

function OnboardingStep({ icon: Icon, image, title, description, children, step, totalSteps }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.05, y: -10 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center py-2"
    >
      {(Icon || image) && (
        <div className="relative mb-6 flex h-20 w-20 shrink-0 items-center justify-center sm:mb-8">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-accent/10 blur-xl"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] border border-line/30 bg-elevated/40 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:scale-110">
            {image ? (
              <img src={image} alt="" className="h-10 w-10 object-contain" />
            ) : (
              <Icon size={32} strokeWidth={1.5} className="text-accent" />
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {step != null && totalSteps != null && (
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Step {step} of {totalSteps}
          </span>
        )}

        <h2 className="text-2xl font-extrabold tracking-tightest text-ink sm:text-3xl">
          {title}
        </h2>

        <p className="mx-auto max-w-sm text-[15px] leading-relaxed text-muted/80">
          {description}
        </p>
      </div>

      {children && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mt-8 w-full"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

export default OnboardingStep;
