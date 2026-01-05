package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentHomeBinding

class HomeFragment : Fragment(R.layout.fragment_home) {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentHomeBinding.bind(view)
        binding.homeJobsButton.setOnClickListener {
            findNavController().navigate(R.id.action_homeFragment_to_jobsFragment)
        }
        binding.homeUploadQueueButton.setOnClickListener {
            findNavController().navigate(R.id.action_homeFragment_to_uploadQueueFragment)
        }
        binding.homeSettingsButton.setOnClickListener {
            findNavController().navigate(R.id.action_homeFragment_to_settingsFragment)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
