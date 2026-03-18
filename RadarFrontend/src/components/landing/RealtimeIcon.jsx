import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const RealtimeIcon = ({ className }) => {
    return (
        <div className={className}>
            <DotLottieReact
                src="/realtime.lottie"
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default RealtimeIcon;
