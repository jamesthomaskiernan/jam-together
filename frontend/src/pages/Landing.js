import Myles from '../images/myles-sax.svg'
import Musicians from '../images/musicians-playing.svg'
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const Landing = () => {
  return (
<Stack spacing={3} direction={{xs: 'column', md: 'row'}} sx={{ marginLeft:"5%", marginRight:"5%", marginTop: "4%"}}>
  <Stack sx={{width: {md: '50%'}}}>
    <Typography>
      <h2 className="landing-text">Who We Are</h2>
      <p className="landing-text">Jam Together is built for musicians. We strive to bring musicians from all backgrounds together.</p>
    </Typography>

    <Typography>
      <h2 className="landing-text">What's a Jam Session?</h2>
      <p className="landing-text">Jam sessions are casual events where musicians can get together and play music. They are different from rehearsals in that they don’t always take place at the same location, time, or have the same people.</p>
    </Typography>
    
    <Stack direction={"row"} >
      <img src={Musicians} flex className='landing-image' alt='Musicians playing together.' />
    </Stack>
    
  
  
  </Stack>
  <Stack  sx={{width: {md: '50%'}, paddingBottom:3}}>
    <img src={Myles} className='landing-image' flex alt='Myles playing the sax!' />
    
  </Stack>
</Stack>
  )
}

export default Landing;