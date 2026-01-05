package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentJobsBinding
import kotlinx.coroutines.launch

class JobsFragment : Fragment(R.layout.fragment_jobs) {

    private val viewModel: JobsViewModel by viewModels()
    private var _binding: FragmentJobsBinding? = null
    private val binding get() = _binding!!
    private val adapter = JobsAdapter { job ->
        val action = JobsFragmentDirections.actionJobsFragmentToJobDetailFragment(job.jobNumber)
        findNavController().navigate(action)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentJobsBinding.bind(view)
        binding.jobsRecyclerView.layoutManager = LinearLayoutManager(requireContext())
        binding.jobsRecyclerView.adapter = adapter
        binding.jobsAddFab.setOnClickListener { showJobForm() }

        collectState()
    }

    private fun showJobForm() {
        val dialogView = layoutInflater.inflate(R.layout.bottom_sheet_job_form, null)
        val jobNumber = dialogView.findViewById<android.widget.EditText>(R.id.jobFormJobNumber)
        val description = dialogView.findViewById<android.widget.EditText>(R.id.jobFormDescription)
        val notes = dialogView.findViewById<android.widget.EditText>(R.id.jobFormNotes)
        val saveButton = dialogView.findViewById<android.widget.Button>(R.id.jobFormSave)

        val dialog = com.google.android.material.bottomsheet.BottomSheetDialog(requireContext())
        dialog.setContentView(dialogView)
        saveButton.setOnClickListener {
            val jobNum = jobNumber.text?.toString()?.trim().orEmpty()
            if (jobNum.isBlank()) {
                Toast.makeText(requireContext(), R.string.job_form_job_number_required, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            lifecycleScope.launch {
                viewModel.save(jobNum, description.text?.toString().orEmpty(), notes.text?.toString().orEmpty())
                Toast.makeText(requireContext(), R.string.job_form_saved, Toast.LENGTH_SHORT).show()
                dialog.dismiss()
            }
        }
        dialog.show()
    }

    private fun collectState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    binding.jobsProgress.visibility = if (state.loading) View.VISIBLE else View.GONE
                    binding.jobsEmpty.visibility =
                        if (!state.loading && state.items.isEmpty()) View.VISIBLE else View.GONE
                    adapter.submitList(state.items)
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
